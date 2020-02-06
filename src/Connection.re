open! Rebase;
open Fn;

module Error = {
  type t =
    | PathSearch(Process.PathSearch.Error.t)
    | Validation(Process.Validation.Error.t)
    | Process(Process.Error.t);

  let toString =
    fun
    | PathSearch(e) => Process.PathSearch.Error.toString(e)
    | Validation(e) => Process.Validation.Error.toString(e)
    | Process(e) => Process.Error.toString(e);
};

type response = Parser.Incr.Event.t(result(Response.t, Parser.Error.t));

type t = {
  metadata: Metadata.t,
  process: Process.t,
  mutable queue: list(Event.t(result(response, Process.Error.t))),
  mutable resetLogOnLoad: bool,
  mutable encountedFirstPrompt: bool,
};

let disconnect = (error, self) => {
  self.metadata.entries = [||];
  self.process.disconnect() |> ignore;
  self.queue |> List.forEach(ev => ev.Event.emit(Error(error)));
  self.queue = [];
  self.encountedFirstPrompt = false;
};

let autoSearch = name =>
  Process.PathSearch.run(name)->Promise.mapError(e => Error.PathSearch(e));

// a more sophiscated "make"
let validateAndMake =
    (pathAndParams): Promise.t(result(Metadata.t, Error.t)) => {
  let validator = (output): result((string, Metadata.Protocol.t), string) => {
    switch (Js.String.match([%re "/Agda version (.*)/"], output)) {
    | None => Error("Cannot read Agda version")
    | Some(match) =>
      switch (match[1]) {
      | None => Error("Cannot read Agda version")
      | Some(version) =>
        Ok((
          version,
          Js.Re.test_([%re "/--interaction-json/"], output)
            ? Metadata.Protocol.EmacsAndJSON : Metadata.Protocol.EmacsOnly,
        ))
      }
    };
  };

  let (path, args) = Parser.commandLine(pathAndParams);
  Process.Validation.run(path ++ " -V", validator)
  ->Promise.mapOk(((version, protocol)) =>
      {Metadata.path, args, version, protocol, entries: [||]}
    )
  ->Promise.mapError(e => Error.Validation(e));
};

let connect = (metadata: Metadata.t): t => {
  let args = [|"--interaction"|] |> Array.concat(metadata.args);
  let process = Process.make(metadata.path, args);

  {
    metadata,
    process,
    queue: [],
    resetLogOnLoad: true,
    encountedFirstPrompt: false,
  };
};

let wire = (self): t => {
  // resolves the requests in the queue
  let handleResponse = (res: response) => {
    switch (self.queue) {
    | [] => ()
    | [req, ...rest] =>
      req.emit(Ok(res));
      // pop the queue on Stop
      switch (res) {
      | Yield(_) => ()
      | Stop =>
        if (self.encountedFirstPrompt) {
          self.queue = rest;
          req.Event.destroy() |> ignore;
        } else {
          self.encountedFirstPrompt = true;
        }
      };
    };
  };

  let logSExpression =
    Parser.Incr.Event.tap(
      Result.forEach(expr => Metadata.logSExpression(expr, self.metadata)),
    );

  // We use the prompt "Agda2>" as the delimiter of the end of a response
  // However, the prompt "Agda2>" also appears at the very start of the conversation
  // So this would be what it looks like:
  //    >>> request
  //      stop          <------- wierd stop
  //      yield
  //      yield
  //      stop
  //    >> request
  //      yield
  //      yield
  //      stop
  //
  let toResponse =
    Parser.Incr.Event.flatMap(
      fun
      | Error(parseError) => Parser.Incr.Event.Yield(Error(parseError))
      | Ok(Parser__Type.SExpression.A("Agda2>")) => Parser.Incr.Event.Stop
      | Ok(tokens) => Parser.Incr.Event.Yield(Response.parse(tokens)),
    );

  let logResponse =
    Parser.Incr.Event.tap(
      Result.forEach(expr => Metadata.logResponse(expr, self.metadata)),
    );

  let pipeline =
    Parser.SExpression.makeIncr(
      logSExpression >> toResponse >> logResponse >> handleResponse,
    );

  // listens to the "data" event on the stdout
  // The chunk may contain various fractions of the Agda output
  let onData: result(string, Process.Error.t) => unit =
    fun
    | Ok(rawText) => {
        // store the raw text in the log
        Metadata.logRawText(rawText, self.metadata);
        // split the raw text into pieces and feed it to the parser
        rawText |> Parser.split |> Array.forEach(Parser.Incr.feed(pipeline));
      }
    | Error(e) => {
        // emit error to all of the request in the queue
        self.queue
        |> List.forEach(req => {
             req.Event.emit(Error(e));
             req.destroy();
           });
        // clean the queue
        self.queue = [];
      };

  self.process.emitter.on(onData) |> ignore;

  self;
};

let send = (request, self): Event.t(result(response, Process.Error.t)) => {
  let reqEvent = Event.make();

  self.queue = [reqEvent, ...self.queue];

  self.process.send(request) |> ignore;

  reqEvent;
};

let resetLog = self => {
  self.metadata.entries = [||];
};