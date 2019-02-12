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
  mutable queue: array(Util.TelePromise.t(string)),
};

type autoSearchError =
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
  | Connection(t, connectionError);

exception AutoSearchExn(autoSearchError);
exception ValidationExn(validationError);
exception ConnectionExn(connectionError);

let toAutoSearchError: Js.Promise.error => option(autoSearchError) =
  [@bs.open]
  (
    fun
    | AutoSearchExn(err) => err
  );

let convertError =
    (
      convertError: Js.Promise.error => option('e),
      f: 'e => Js.Promise.t('a),
      error: Js.Promise.error,
    )
    : Js.Promise.t('a) =>
  switch (convertError(error)) {
  | Some(e) => f(e)
  | None => raise(Util.UnhandledPromise)
  };

let handleAutoSearchError = (f, error) =>
  switch (toAutoSearchError(error)) {
  | Some(e) => f(e)
  | None => raise(Util.UnhandledPromise)
  };

let toValidationError: Js.Promise.error => option(validationError) =
  [@bs.open]
  (
    fun
    | ValidationExn(err) => err
  );

let handleValidationError = (f, error) =>
  switch (toValidationError(error)) {
  | Some(e) => f(e)
  | None => raise(Util.UnhandledPromise)
  };

let toConnectionError: Js.Promise.error => option(connectionError) =
  [@bs.open]
  (
    fun
    | ConnectionExn(err) => err
  );

let handleConnectionError = (f, error) =>
  switch (toConnectionError(error)) {
  | Some(e) => f(e)
  | None => raise(Util.UnhandledPromise)
  };

/* a more sophiscated "make" */
let autoSearch = (path): Js.Promise.t(string) =>
  Js.Promise.make((~resolve, ~reject) =>
    switch (N.OS.type_()) {
    | "Linux"
    | "Darwin" =>
      /* reject if the process hasn't responded for more than 1 second */
      let hangTimeout =
        Js.Global.setTimeout(
          () => reject(. ValidationExn(ProcessHanging)),
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
            reject(.
              AutoSearchExn(
                NotFound(err |> Js.Exn.message |> Option.getOr("")),
              ),
            )
          };

          /* stderr */
          let stderr' = stderr |> Node.Buffer.toString;
          if (stderr' |> String.isEmpty |> (!)) {
            reject(. AutoSearchExn(NotFound(stderr')));
          };

          /* stdout */
          let stdout' = stdout |> Node.Buffer.toString;
          if (stdout' |> String.isEmpty) {
            reject(. AutoSearchExn(NotFound("")));
          } else {
            resolve(. Parser.filepath(stdout'));
          };
        },
      )
      |> ignore;
    | "Windows_NT" => reject(. AutoSearchExn(NotSupported("Windows_NT")))
    | os => reject(. AutoSearchExn(NotSupported(os)))
    }
  );

/* a more sophiscated "make" */
let validateAndMake = (path): Js.Promise.t(metadata) => {
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
          version,
          protocol:
            Js.Re.test(message, [%re "/--interaction-json/"]) ?
              EmacsAndJSON : EmacsOnly,
        })
      }
    };
  };

  Js.Promise.make((~resolve, ~reject) => {
    if (path |> String.isEmpty) {
      reject(. ValidationExn(PathMalformed("the path must not be empty")));
    };

    /* reject if the process hasn't responded for more than 1 second */
    let hangTimeout =
      Js.Global.setTimeout(
        () => reject(. ValidationExn(ProcessHanging)),
        1000,
      );

    N.ChildProcess.exec(
      parsedPath,
      (error, stdout, stderr) => {
        /* clear timeout as the process has responded */
        Js.Global.clearTimeout(hangTimeout);

        /* parses `error` and rejects it if there's any  */
        switch (parseError(error)) {
        | None => ()
        | Some(err) => reject(. ValidationExn(err))
        };

        /* stderr */
        let stderr' = stderr |> Node.Buffer.toString;
        if (stderr' |> String.isEmpty |> (!)) {
          reject(. ValidationExn(ProcessError(stderr')));
        };

        /* stdout */
        switch (parseStdout(stdout)) {
        | Error(err) => reject(. ValidationExn(err))
        | Ok(self) => resolve(. self)
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

let connect = (metadata): Js.Promise.t(t) => {
  N.(
    Js.Promise.make((~resolve, ~reject) => {
      let args =
        useJSON(metadata) ? [|"--interaction-json"|] : [|"--interaction"|];
      let process = ChildProcess.spawn(metadata.path, args, {"shell": true});
      /* Handles errors and anomalies */
      process
      |> ChildProcess.on(
           `error(exn => reject(. ConnectionExn(ShellError(exn)))),
         )
      |> ChildProcess.on(
           `close(
             (code, signal) =>
               reject(. ConnectionExn(Close(code, signal))),
           ),
         )
      |> ignore;
      process
      |> ChildProcess.stdout
      |> Stream.Readable.once(
           `data(_ => resolve(. {metadata, process, queue: [||]})),
         )
      |> ignore;
    })
  );
};

let disconnect = self => {
  self.process |> N.ChildProcess.kill("SIGTERM");
};

let wire = (self): Js.Promise.t(t) => {
  /* resolves the requests in the queue */
  let response = data => {
    switch (self.queue[0]) {
    | None => Js.log("WTF!!")
    | Some(req) =>
      req.resolve(data);
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

  Js.Promise.resolve(self);
};

let send = (request, self): Js.Promise.t(string) => {
  let reqPromise = Util.TelePromise.make();
  self.queue |> Js.Array.push(reqPromise) |> ignore;

  /* write */
  self.process
  |> N.ChildProcess.stdin
  |> N.Stream.Writable.write(request ++ "\n" |> Node.Buffer.fromString)
  |> ignore;

  reqPromise.wire();
};
