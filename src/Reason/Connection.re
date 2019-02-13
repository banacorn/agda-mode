open Rebase;

/* supported protocol */
type protocol =
  | EmacsOnly
  | EmacsAndJSON;

type metadata = {
  path: string,
  version: string,
  protocol,
};

/* type connection = {
   stdout: Stream.Readable.t,
   stdin: Stream.Writable.t, */
/* }; */

type t = {
  metadata,
  process: N.ChildProcess.t,
  mutable queue: array(Util.Event.t(string)),
};

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
  | Close(int, string);

type error =
  | AutoSearch(autoSearchError)
  | Validation(string, validationError)
  | Connection(connectionError);

/* a more sophiscated "make" */
let autoSearch = (path): Js.Promise.t(result(string, autoSearchError)) =>
  Js.Promise.make(
    (~resolve: (. result(string, autoSearchError)) => unit, ~reject as _) =>
    switch (N.OS.type_()) {
    | "Linux"
    | "Darwin" =>
      /* reject if the process hasn't responded for more than 1 second */
      let hangTimeout =
        Js.Global.setTimeout(() => resolve(. Error(ProcessHanging)), 1000);
      N.ChildProcess.exec(
        "which " ++ path,
        (error, stdout, stderr) => {
          /* clear timeout as the process has responded */
          Js.Global.clearTimeout(hangTimeout);

          /* error */
          switch (error |> Js.Nullable.toOption) {
          | None => ()
          | Some(err) =>
            resolve(.
              Error(NotFound(err |> Js.Exn.message |> Option.getOr(""))),
            )
          };

          /* stderr */
          let stderr' = stderr |> Node.Buffer.toString;
          if (stderr' |> String.isEmpty |> (!)) {
            resolve(. Error(NotFound(stderr')));
          };

          /* stdout */
          let stdout' = stdout |> Node.Buffer.toString;
          if (stdout' |> String.isEmpty) {
            resolve(. Error(NotFound("")));
          } else {
            resolve(. Ok(Parser.filepath(stdout')));
          };
        },
      )
      |> ignore;
    | "Windows_NT" => resolve(. Error(NotSupported("Windows_NT")))
    | os => resolve(. Error(NotSupported(os)))
    }
  );

/* a more sophiscated "make" */
let validateAndMake =
    (path): Js.Promise.t(result(metadata, validationError)) => {
  let parsedPath = Parser.filepath(path);
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
          path: parsedPath,
          version: Util.Semver.coerce(version),
          protocol:
            Js.Re.test(message, [%re "/--interaction-json/"]) ?
              EmacsAndJSON : EmacsOnly,
        })
      }
    };
  };

  Js.Promise.make((~resolve, ~reject as _) => {
    if (path |> String.isEmpty) {
      resolve(. Error(PathMalformed("the path must not be empty")));
    };

    /* reject if the process hasn't responded for more than 1 second */
    let hangTimeout =
      Js.Global.setTimeout(() => resolve(. Error(ProcessHanging)), 1000);

    N.ChildProcess.exec(
      parsedPath,
      (error, stdout, stderr) => {
        /* clear timeout as the process has responded */
        Js.Global.clearTimeout(hangTimeout);

        /* parses `error` and rejects it if there's any  */
        switch (parseError(error)) {
        | None => ()
        | Some(err) => resolve(. Error(err))
        };

        /* stderr */
        let stderr' = stderr |> Node.Buffer.toString;
        if (stderr' |> String.isEmpty |> (!)) {
          resolve(. Error(ProcessError(stderr')));
        };

        /* stdout */
        switch (parseStdout(stdout)) {
        | Error(err) => resolve(. Error(err))
        | Ok(self) => resolve(. Ok(self))
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

let connect = (metadata): Js.Promise.t(result(t, connectionError)) => {
  N.(
    Js.Promise.make((~resolve, ~reject as _) => {
      let args =
        useJSON(metadata) ? [|"--interaction-json"|] : [|"--interaction"|];
      let process = ChildProcess.spawn(metadata.path, args, {"shell": true});
      /* Handles errors and anomalies */
      process
      |> ChildProcess.on(
           `error(exn => resolve(. Error(ShellError(exn)))),
         )
      |> ChildProcess.on(
           `close(
             (code, signal) => resolve(. Error(Close(code, signal))),
           ),
         )
      |> ignore;
      process
      |> ChildProcess.stdout
      |> Stream.Readable.once(
           `data(_ => resolve(. Ok({metadata, process, queue: [||]}))),
         )
      |> ignore;
    })
  );
};

let disconnect = self => {
  self.process |> N.ChildProcess.kill("SIGTERM");
};

let wire = (self): t => {
  /* resolves the requests in the queue */
  let response = data => {
    Js.log("receiving <<< " ++ data);
    switch (self.queue[0]) {
    | None => Js.log("WTF!!")
    | Some(req) =>
      req |> Util.Event.resolve(data);
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

let send = (request, self): Js.Promise.t(string) => {
  Js.log("sending >>> " ++ request);
  let reqPromise = Util.Event.make();
  self.queue |> Js.Array.push(reqPromise) |> ignore;

  /* listen */
  let promise = reqPromise |> Util.Event.once;
  /* write */
  self.process
  |> N.ChildProcess.stdin
  |> N.Stream.Writable.write(request ++ "\n" |> Node.Buffer.fromString)
  |> ignore;

  promise;
};
