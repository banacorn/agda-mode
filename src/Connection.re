open! Rebase;
open Fn;

type response = Parser.Incr.Event.t(result(Response.t, Parser.Error.t));

type t = {
  metadata: Metadata.t,
  process: Nd.ChildProcess.t,
  mutable queue:
    array(Event.t(result(response, Connection2.Process.Error.t))),
  errorEmitter: Event.t(Response.t),
  mutable connected: bool,
  mutable resetLogOnLoad: bool,
};

let disconnect = (error, self) => {
  self.metadata.entries = [||];
  self.process |> Nd.ChildProcess.kill_("SIGTERM") |> ignore;
  self.queue |> Array.forEach(ev => ev.Event.emit(Error(error)));
  self.queue = [||];
  self.errorEmitter.destroy();
  self.connected = false;
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

let connect =
    (metadata: Metadata.t): Promise.t(result(t, Connection2.Error.t)) =>
  {
    let (promise, resolve) = Promise.pending();

    let args = [|"--interaction"|] |> Array.concat(metadata.args);
    let process =
      Nd.ChildProcess.spawn_(
        metadata.path,
        args,
        Nd.ChildProcess.spawnOption(
          ~shell=Nd.ChildProcess.Shell.bool(true),
          (),
        ),
      );

    let connection = {
      metadata,
      process,
      connected: true,
      queue: [||],
      errorEmitter: Event.make(),
      resetLogOnLoad: true,
    };
    /* Handles errors and anomalies */
    process
    |> Nd.ChildProcess.on(
         `error(
           exn => {
             connection
             |> disconnect(Connection2.Process.Error.ShellError(exn));
             resolve(Error(Connection2.Process.Error.ShellError(exn)));
           },
         ),
       )
    |> Nd.ChildProcess.on(
         `close(
           (code, signal) => {
             connection |> disconnect(ClosedByProcess(code, signal));
             resolve(Error(ClosedByProcess(code, signal)));
           },
         ),
       )
    |> ignore;
    process
    |> Nd.ChildProcess.stdout
    |> Nd.Stream.Readable.once(`data(_ => resolve(Ok(connection))))
    |> ignore;

    promise;
  }
  ->Promise.mapError(e => Connection2.Error.ConnectionError(e));

let wire = (self): t => {
  /* resolves the requests in the queue */
  let response = (res: response) => {
    switch (self.queue[0]) {
    | None =>
      switch (res) {
      | OnResult(Ok(data)) => self.errorEmitter.emit(data)
      | _ => ()
      }
    | Some(req) =>
      req.emit(Ok(res));
      switch (res) {
      | OnResult(_) => ()
      | OnFinish =>
        self.queue
        |> Js.Array.pop
        |> Option.forEach(ev => ev.Event.destroy |> ignore)
      };
    };
  };
  let logSExpression =
    Parser.Incr.Event.map(
      Result.map(expr => {
        Metadata.logSExpression(expr, self.metadata);
        expr;
      }),
    );

  // let toResponse = Parser.Incr.Event.map(x => x);
  let toResponse =
    Parser.Incr.Event.flatMap(
      fun
      | Error(parseError) => Parser.Incr.Event.OnResult(Error(parseError))
      | Ok(Parser__Type.SExpression.A("Agda2>")) => Parser.Incr.Event.OnFinish
      | Ok(tokens) => Parser.Incr.Event.OnResult(Response.parse(tokens)),
    );

  let logResponse =
    Parser.Incr.Event.map(
      Result.map(expr => {
        Metadata.logResponse(expr, self.metadata);
        expr;
      }),
    );

  let callback =
    Parser.SExpression.makeIncr(
      logSExpression >> toResponse >> logResponse >> response,
    );

  /* listens to the "data" event on the stdout */
  /* The chunk may contain various fractions of the Agda output */
  let onData: Node.buffer => unit =
    chunk => {
      /* serialize the binary chunk into string */
      let rawText = chunk |> Node.Buffer.toString;
      /* store the raw text in the log */
      Metadata.logRawText(rawText, self.metadata);
      // run the parser
      rawText |> Parser.split |> Array.forEach(Parser.Incr.feed(callback));
    };
  self.process
  |> Nd.ChildProcess.stdout
  |> Nd.Stream.Readable.on(`data(onData))
  |> ignore;

  self;
};

let send =
    (request, self): Event.t(result(response, Connection2.Process.Error.t)) => {
  let reqEvent = Event.make();
  self.queue |> Js.Array.push(reqEvent) |> ignore;

  /* write */
  self.process
  |> Nd.ChildProcess.stdin
  |> Nd.Stream.Writable.write(request ++ "\n" |> Node.Buffer.fromString)
  |> ignore;

  reqEvent;
};

let resetLog = self => {
  self.metadata.entries = [||];
};