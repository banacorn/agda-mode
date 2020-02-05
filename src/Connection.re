open! Rebase;
open Fn;

// module Error = {
//   type autoSearch =
//     | ProcessHanging(string)
//     | NotSupported(string)
//     | NotFound(string, string);

//   type validation =
//     /* the path is empty */
//     | PathMalformed(string)
//     /* the process is not responding */
//     | ProcessHanging
//     /* from the shell */
//     | NotFound(Js.Exn.t)
//     | ShellError(Js.Exn.t)
//     /* from its stderr */
//     | ProcessError(string)
//     /* the process is not Agda */
//     | IsNotAgda(string);

//   type connection =
//     | ShellError(Js.Exn.t)
//     | ClosedByProcess(int, string)
//     | DisconnectedByUser;

//   type t =
//     | AutoSearchError(autoSearch)
//     | ValidationError(string, validation)
//     | ConnectionError(connection);

//   let toString =
//     fun
//     | AutoSearchError(ProcessHanging("agda")) => (
//         {js|Process not responding|js},
//         {j|Please restart the process|j},
//       )
//     | AutoSearchError(ProcessHanging(name)) => (
//         "Process not responding when looking for \"" ++ name ++ "\"",
//         {j|Please restart the process|j},
//       )
//     | AutoSearchError(NotSupported(os)) => (
//         "Auto search failed",
//         {j|currently auto path searching is not supported on $(os)|j},
//       )
//     | AutoSearchError(NotFound("agda", msg)) => ("Auto search failed", msg)
//     | AutoSearchError(NotFound(name, msg)) => (
//         "Auto search failed when looking for \"" ++ name ++ "\"",
//         msg,
//       )
//     | ValidationError(_path, PathMalformed(msg)) => ("Path malformed", msg)
//     | ValidationError(_path, ProcessHanging) => (
//         "Process hanging",
//         "The program has not been responding for more than 1 sec",
//       )
//     | ValidationError(_path, NotFound(error)) => (
//         "Agda not found",
//         Util.JsError.toString(error),
//       )
//     | ValidationError(_path, ShellError(error)) => (
//         "Error from the shell",
//         Util.JsError.toString(error),
//       )
//     | ValidationError(_path, ProcessError(msg)) => (
//         "Error from the stderr",
//         msg,
//       )
//     | ValidationError(_path, IsNotAgda(msg)) => ("This is not agda", msg)
//     | ConnectionError(ShellError(error)) => (
//         "Socket error",
//         Util.JsError.toString(error),
//       )
//     | ConnectionError(ClosedByProcess(code, signal)) => (
//         "Socket closed by Agda",
//         {j|code: $code
// signal: $signal
// It's probably because Agda's not happy about the arguments you fed her
// |j},
//       )
//     | ConnectionError(DisconnectedByUser) => (
//         "Disconnected",
//         "Connection disconnected by ourselves",
//       );
// };

// module Error = Connection2.Error;

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

let autoSearch = (name): Promise.t(result(string, Connection2.Error.t)) =>
  {
    let (promise, resolve) = Promise.pending();

    // reject if the process hasn't responded for more than 1 second
    let hangTimeout =
      Js.Global.setTimeout(
        () =>
          resolve(
            Error(ProcessHanging(name): Connection2.PathSearch.Error.t),
          ),
        1000,
      );

    let commandName =
      switch (N.OS.type_()) {
      | "Linux"
      | "Darwin" => Ok("which")
      | "Windows_NT" => Ok("where.exe")
      | os => Error(os)
      };

    switch (commandName) {
    | Error(os) => resolve(Error(NotSupported(os)))
    | Ok(commandName') =>
      Nd.ChildProcess.exec(
        commandName' ++ " " ++ name,
        (error, stdout, stderr) => {
          /* clear timeout as the process has responded */
          Js.Global.clearTimeout(hangTimeout);

          /* error */
          switch (error |> Js.Nullable.toOption) {
          | None => ()
          | Some(err) =>
            resolve(
              Error(
                NotFound(name, err |> Js.Exn.message |> Option.getOr("")),
              ),
            )
          };

          /* stderr */
          let stderr' = stderr |> Node.Buffer.toString;
          if (stderr' |> String.isEmpty |> (!)) {
            resolve(Error(NotFound(name, stderr')));
          };

          /* stdout */
          let stdout' = stdout |> Node.Buffer.toString;
          if (stdout' |> String.isEmpty) {
            resolve(Error(NotFound(name, "")));
          } else {
            resolve(Ok(stdout'));
          };
        },
      )
      |> ignore
    };

    promise;
  }
  ->Promise.mapError(e => Connection2.Error.PathSearchError(e));

// a more sophiscated "make"
let validateAndMake =
    (pathAndParams): Promise.t(result(Metadata.t, Connection2.Error.t)) =>
  {
    let (path, args) = Parser.commandLine(pathAndParams);
    let parseError =
        (error: Js.Nullable.t(Js.Exn.t))
        : option(Connection2.Validation.Error.t) => {
      switch (error |> Js.Nullable.toOption) {
      | None => None
      | Some(err) =>
        let message = err |> Js.Exn.message |> Option.getOr("");
        if (message |> Js.Re.test_([%re "/No such file or directory/"], _)) {
          Some(NotFound(err));
        } else if (message |> Js.Re.test_([%re "/command not found/"], _)) {
          Some(NotFound(err));
        } else {
          Some(ShellError(err));
        };
      };
    };
    let parseVersion =
        (stdout: Node.Buffer.t)
        : result(Metadata.t, Connection2.Validation.Error.t) => {
      let message = stdout |> Node.Buffer.toString;
      switch (Js.String.match([%re "/Agda version (.*)/"], message)) {
      | None => Error(WrongProcess(message))
      | Some(match) =>
        switch (match[1]) {
        | None => Error(WrongProcess(message))
        | Some(version) =>
          Ok({
            path,
            args,
            version,
            protocol:
              Js.Re.test_([%re "/--interaction-json/"], message)
                ? EmacsAndJSON : EmacsOnly,
            entries: [||],
          })
        }
      };
    };

    let (promise, resolve) = Promise.pending();

    if (path |> String.isEmpty) {
      resolve(
        Error(
          Connection2.Validation.Error.PathMalformed(
            "the path must not be empty",
          ),
        ),
      );
    };

    // reject if the process hasn't responded for more than 20 second
    // (it may take longer for dockerized Agda to take off)
    let hangTimeout =
      Js.Global.setTimeout(() => resolve(Error(ProcessHanging)), 20000);

    Nd.ChildProcess.exec(
      path ++ " -V",
      (error, stdout, stderr) => {
        /* clear timeout as the process has responded */
        Js.Global.clearTimeout(hangTimeout);
        /* parses `error` and rejects it if there's any  */
        switch (parseError(error)) {
        | None => ()
        | Some(err) => resolve(Error(err))
        };

        /* stderr */
        let stderr' = stderr |> Node.Buffer.toString;
        if (stderr' |> String.isEmpty |> (!)) {
          resolve(Error(ProcessError(stderr')));
        };
        /* stdout */
        switch (parseVersion(stdout)) {
        | Error(err) => resolve(Error(err))
        | Ok(self) => resolve(Ok(self))
        };
      },
    )
    |> ignore;

    promise;
  }
  ->Promise.mapError(e => Connection2.Error.ValidationError(e));

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