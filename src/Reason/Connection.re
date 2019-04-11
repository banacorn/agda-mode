open Rebase;

/* supported protocol */
type protocol =
  | EmacsOnly
  | EmacsAndJSON;

type metadata = {
  path: string,
  args: array(string),
  version: string,
  protocol,
};

type viewAction =
  | Connect(string)
  | AutoSearch;

type autoSearchError =
  | ProcessHanging
  | NotSupported(string)
  | NotFound(string);

type validationError =
  /* the path is empty */
  | PathMalformed(string)
  /* the process is not responding */
  | ProcessHanging
  /* from the shell */
  | NotFound(Js.Exn.t)
  | ShellError(Js.Exn.t)
  /* from its stderr */
  | ProcessError(string)
  /* the process is not Agda */
  | IsNotAgda(string);

type connectionError =
  | ShellError(Js.Exn.t)
  | ClosedByProcess(int, string)
  | DisconnectedByUser;

type error =
  | AutoSearchError(autoSearchError)
  | ValidationError(string, validationError)
  | ConnectionError(connectionError);

type t = {
  metadata,
  process: N.ChildProcess.t,
  mutable queue: array(Event.t(string, connectionError)),
  errorEmitter: Event.t(string, unit),
  mutable connected: bool,
};

let disconnect = (error, self) => {
  self.queue |> Array.forEach(ev => ev |> Event.emitError(error));
  self.queue = [||];
  self.errorEmitter |> Event.removeAllListeners;
  self.connected = false;
  self.process |> N.ChildProcess.kill("SIGTERM");
};

/* a more sophiscated "make" */
let autoSearch = (path): Async.t(string, autoSearchError) =>
  Async.make((resolve, reject) =>
    switch (N.OS.type_()) {
    | "Linux"
    | "Darwin" =>
      /* reject if the process hasn't responded for more than 1 second */
      let hangTimeout =
        Js.Global.setTimeout(
          () => reject(ProcessHanging: autoSearchError),
          1000,
        );
      N.ChildProcess.exec(
        "which " ++ path,
        (error, stdout, stderr) => {
          /* clear timeout as the process has responded */
          Js.Global.clearTimeout(hangTimeout);

          /* error */
          switch (error |> Js.Nullable.toOption) {
          | None => ()
          | Some(err) =>
            reject(NotFound(err |> Js.Exn.message |> Option.getOr("")))
          };

          /* stderr */
          let stderr' = stderr |> Node.Buffer.toString;
          if (stderr' |> String.isEmpty |> (!)) {
            reject(NotFound(stderr'));
          };

          /* stdout */
          let stdout' = stdout |> Node.Buffer.toString;
          if (stdout' |> String.isEmpty) {
            reject(NotFound(""));
          } else {
            resolve(Parser.filepath(stdout'));
          };
        },
      )
      |> ignore;
    | "Windows_NT" => reject(NotSupported("Windows_NT"))
    | os => reject(NotSupported(os))
    }
  );

/* a more sophiscated "make" */
let validateAndMake = (pathAndParams): Async.t(metadata, validationError) => {
  let (path, args) = Parser.commandLine(pathAndParams);
  let parseError = (error: Js.Nullable.t(Js.Exn.t)): option(validationError) => {
    switch (error |> Js.Nullable.toOption) {
    | None => None
    | Some(err) =>
      let message = err |> Js.Exn.message |> Option.getOr("");
      if (message |> Js.Re.test(_, [%re "/No such file or directory/"])) {
        Some(NotFound(err));
      } else if (message |> Js.Re.test(_, [%re "/command not found/"])) {
        Some(NotFound(err));
      } else {
        Some(ShellError(err));
      };
    };
  };
  let parseStdout =
      (stdout: Node.Buffer.t): result(metadata, validationError) => {
    let message = stdout |> Node.Buffer.toString;
    switch (Js.String.match([%re "/Agda version (.*)/"], message)) {
    | None => Error(IsNotAgda(message))
    | Some(match) =>
      switch (match[1]) {
      | None => Error(IsNotAgda(message))
      | Some(version) =>
        Ok({
          path,
          args,
          version: Util.Semver.coerce(version),
          protocol:
            Js.Re.test(message, [%re "/--interaction-json/"]) ?
              EmacsAndJSON : EmacsOnly,
        })
      }
    };
  };

  Async.make((resolve, reject) => {
    if (path |> String.isEmpty) {
      reject(PathMalformed("the path must not be empty"));
    };

    /* reject if the process hasn't responded for more than 1 second */
    let hangTimeout =
      Js.Global.setTimeout(() => reject(ProcessHanging), 1000);

    N.ChildProcess.exec(
      path,
      (error, stdout, stderr) => {
        /* clear timeout as the process has responded */
        Js.Global.clearTimeout(hangTimeout);

        /* parses `error` and rejects it if there's any  */
        switch (parseError(error)) {
        | None => ()
        | Some(err) => reject(err)
        };

        /* stderr */
        let stderr' = stderr |> Node.Buffer.toString;
        if (stderr' |> String.isEmpty |> (!)) {
          reject(ProcessError(stderr'));
        };

        /* stdout */
        switch (parseStdout(stdout)) {
        | Error(err) => reject(err)
        | Ok(self) => resolve(self)
        };
      },
    )
    |> ignore;
  });
};

let useJSON = metadata => {
  Atom.Environment.Config.get("agda-mode.enableJSONProtocol")
  && metadata.protocol == EmacsAndJSON;
};

let connect = (metadata): Async.t(t, connectionError) => {
  N.(
    Async.make((resolve, reject) => {
      let args =
        (useJSON(metadata) ? [|"--interaction-json"|] : [|"--interaction"|])
        |> Array.concat(metadata.args);
      let process = ChildProcess.spawn(metadata.path, args, {"shell": true});

      let connection = {
        metadata,
        process,
        connected: true,
        queue: [||],
        errorEmitter: Event.make(),
      };
      /* Handles errors and anomalies */
      process
      |> ChildProcess.on(
           `error(
             exn => {
               connection |> disconnect(ShellError(exn));
               reject(ShellError(exn));
             },
           ),
         )
      |> ChildProcess.on(
           `close(
             (code, signal) => {
               connection |> disconnect(ClosedByProcess(code, signal));
               reject(ClosedByProcess(code, signal));
             },
           ),
         )
      |> ignore;
      process
      |> ChildProcess.stdout
      |> Stream.Readable.once(`data(_ => resolve(connection)))
      |> ignore;
    })
  );
};

let wire = (self): t => {
  /* resolves the requests in the queue */
  let response = data => {
    Js.log("receiving <<< " ++ data);
    switch (self.queue[0]) {
    | None => self.errorEmitter |> Event.emitOk(data)
    | Some(req) =>
      req |> Event.emitOk(data);
      /* should updates the queue */
      self.queue |> Js.Array.pop |> ignore;
    };
  };

  let buffer = ref("");
  /* listens to the "data" event on the stdout */
  let onData = chunk => {
    let string = chunk |> Node.Buffer.toString;

    /* the prompt "Agda2> " should appear at the end of the response */
    let endOfResponse = string |> String.endsWith("Agda2> ");
    if (endOfResponse) {
      let withoutSuffix =
        Js.String.substring(~from=0, ~to_=String.length(string) - 7, string);
      /* append it to the accumulated buffer (without for the "Agda2> " suffix) */
      let data = buffer^ ++ withoutSuffix;
      if (data |> String.isEmpty |> (!)) {
        response(data);
      };
      /* empty the buffer */
      buffer := "";
    } else {
      /* append to the buffer and wait until the end of the response */
      buffer := buffer^ ++ string;
    };
  };

  self.process
  |> N.ChildProcess.stdout
  |> N.Stream.Readable.on(`data(onData))
  |> ignore;

  self;
};

let send = (request, self): Async.t(string, connectionError) => {
  Js.log("sending >>> " ++ request);
  let reqPromise = Event.make();
  self.queue |> Js.Array.push(reqPromise) |> ignore;

  /* listen */
  let promise = reqPromise |> Event.once;
  /* write */
  self.process
  |> N.ChildProcess.stdin
  |> N.Stream.Writable.write(request ++ "\n" |> Node.Buffer.fromString)
  |> ignore;

  promise;
};
