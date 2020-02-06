open! Rebase;
open Fn;

type response = Parser.Incr.Event.t(result(Response.t, Parser.Error.t));

type t = {
  metadata: Metadata.t,
  process: Connection2.Process.t,
  mutable queue:
    array(Event.t(result(response, Connection2.Process.Error.t))),
  errorEmitter: Event.t(Response.t),
  mutable connected: bool,
  mutable resetLogOnLoad: bool,
  mutable encountedFirstPrompt: bool,
};

let disconnect = (error, self) => {
  self.metadata.entries = [||];
  self.process.disconnect() |> ignore;
  self.queue |> Array.forEach(ev => ev.Event.emit(Error(error)));
  self.queue = [||];
  self.errorEmitter.destroy();
  self.connected = false;
  self.encountedFirstPrompt = false;
};

let autoSearch = name =>
  Connection2.PathSearch.run(name)
  ->Promise.mapError(e => Connection2.Error.PathSearchError(e));

// a more sophiscated "make"
let validateAndMake =
    (pathAndParams): Promise.t(result(Metadata.t, Connection2.Error.t)) => {
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
  Connection2.Validation.run(path ++ " -V", validator)
  ->Promise.mapOk(((version, protocol)) =>
      {Metadata.path, args, version, protocol, entries: [||]}
    )
  ->Promise.mapError(e => Connection2.Error.ValidationError(e));
};

let connect = (metadata: Metadata.t): t => {
  let args = [|"--interaction"|] |> Array.concat(metadata.args);
  let process = Connection2.Process.make(metadata.path, args);

  {
    metadata,
    process,
    connected: true,
    queue: [||],
    errorEmitter: Event.make(),
    resetLogOnLoad: true,
    encountedFirstPrompt: false,
  };
};

let wire = (self): t => {
  // resolves the requests in the queue
  let handleResponse = (res: response) => {
    switch (self.queue[0]) {
    | None =>
      switch (res) {
      | Yield(Ok(data)) =>
        Js.log2("[ unbound response ] ", data);
        self.errorEmitter.emit(data);
      | _ => ()
      }
    | Some(req) =>
      req.emit(Ok(res));
      switch (res) {
      | Yield(_) => ()
      | Stop =>
        if (self.encountedFirstPrompt) {
          self.queue
          |> Js.Array.pop
          |> Option.forEach(ev => ev.Event.destroy |> ignore);
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
  let onData: result(string, Connection2.Process.Error.t) => unit =
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
        |> Array.forEach(req => {
             req.Event.emit(Error(e));
             req.destroy();
           });
        // clean the queue
        self.queue = [||];
      };

  self.process.emitter.on(onData) |> ignore;

  self;
};

let send =
    (request, self): Event.t(result(response, Connection2.Process.Error.t)) => {
  let reqEvent = Event.make();

  self.queue |> Js.Array.push(reqEvent) |> ignore;

  self.process.send(request) |> ignore;

  reqEvent;
};

let resetLog = self => {
  self.metadata.entries = [||];
};