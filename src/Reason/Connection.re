open Rebase;

/* Node Child Process API */

module StreamType = {
  module Readable = {
    type t;
  };
  module Writable = {
    type t;
  };
};

module Stream = {
  module Writable = {
    type t = StreamType.Writable.t;
    type listener = [
      | `close(unit => unit)
      | `drain(unit => unit)
      | `error(Js.Exn.t => unit)
      | `finish(unit => unit)
      | `pipe(StreamType.Readable.t => unit)
      | `unpipe(StreamType.Readable.t => unit)
    ];
    [@bs.send.pipe: t] external on: listener => t = "";
    [@bs.send.pipe: t] external once: listener => t = "";

    [@bs.send.pipe: t] external cork: unit = "";
    [@bs.send.pipe: t] external destroy: unit = "";
    [@bs.send.pipe: t] external destroy_: Js.Exn.t => t = "destroy";
    [@bs.send.pipe: t] external end_: t = "end";
    [@bs.send.pipe: t]
    external end__: (Node.Buffer.t, string, unit => unit) => t = "end";
    [@bs.send.pipe: t] external setDefaultEncoding: string => t = "";
    [@bs.send.pipe: t] external uncork: unit = "";
    [@bs.send.pipe: t] external writable: bool = "";
    [@bs.send.pipe: t] external writableHighWaterMark: int = "";
    [@bs.send.pipe: t] external writableLength: int = "";
    [@bs.send.pipe: t] external write: Node.Buffer.t => bool = "";
    [@bs.send.pipe: t]
    external write_: (Node.Buffer.t, string, unit => unit) => bool = "write";
  };
  module Readable = {
    type t = StreamType.Readable.t;
    [@bs.send.pipe: t]
    external on:
      (
      [@bs.string]
      [
        | `close(unit => unit)
        | `data(Node.Buffer.t => unit)
        | [@bs.as "end"] `end_(unit => unit)
        | `error(Js.Exn.t => unit)
        | `readable(unit => unit)
      ]
      ) =>
      t =
      "";
    [@bs.send.pipe: t]
    external once:
      (
      [@bs.string]
      [
        | `close(unit => unit)
        | `data(Node.Buffer.t => unit)
        | [@bs.as "end"] `end_(unit => unit)
        | `error(Js.Exn.t => unit)
        | `readable(unit => unit)
      ]
      ) =>
      t =
      "";

    [@bs.send.pipe: t] external destroy: t = "";
    [@bs.send.pipe: t] external destroy_: Js.Exn.t => t = "destroy";
    [@bs.send.pipe: t] external isPaused: bool = "";
    [@bs.send.pipe: t] external pause: t = "";
    [@bs.send.pipe: t]
    external pipe: StreamType.Writable.t => StreamType.Writable.t = "";
    [@bs.send.pipe: t]
    external pipe_:
      (StreamType.Writable.t, {. "end": bool}) => StreamType.Writable.t =
      "pipe";
    [@bs.send.pipe: t] [@bs.send.pipe: t] external read: Node.Buffer.t = "";
    [@bs.send.pipe: t] external read_: int => Node.Buffer.t = "read";
    [@bs.send.pipe: t] external readable: bool = "";
    [@bs.send.pipe: t] external readableHighWaterMark: int = "";
    [@bs.send.pipe: t] external readableLength: int = "";
    [@bs.send.pipe: t] external resume: t = "";
    [@bs.send.pipe: t] external setEncoding: string => t = "";
    [@bs.send.pipe: t] external unpipe: StreamType.Writable.t => t = "";
    [@bs.send.pipe: t] external unshift: Node.Buffer.t => unit = "";
    /* [@bs.send.pipe: t] external wrap: Stream.t => unit = ""; */
  };
};

module ChildProcess = {
  type t;

  [@bs.get] external stdout: t => Stream.Readable.t = "";
  [@bs.get] external stdin: t => Stream.Writable.t = "";

  [@bs.send.pipe: t]
  external on:
    (
    [@bs.string]
    [
      | `disconnect(unit => unit)
      | `error(Js.Exn.t => unit)
      | `close((int, string) => unit)
      | `exit((int, string) => unit)
      | `message(Js.t({.}) => unit)
    ]
    ) =>
    t =
    "";

  type execCallback =
    (Js.Nullable.t(Js.Exn.t), Node.Buffer.t, Node.Buffer.t) => unit;
  [@bs.module "child_process"] external exec: (string, execCallback) => t = "";
  type spawnOption = {. "shell": bool};

  [@bs.module "child_process"]
  external spawn: (string, array(string), spawnOption) => t = "";
};

/* Node Child Process API */
module OS = {
  [@bs.module "os"] external type_: unit => string = "type";
};

/* supported protocol */
type protocol =
  | EmacsOnly
  | EmacsAndJSON;

type metadata = {
  path: string,
  version: string,
  protocol,
};

type connection = {
  stdout: Stream.Readable.t,
  stdin: Stream.Writable.t,
  mutable queue: array(Util.TelePromise.t(string)),
};

type t = {
  metadata,
  connection: option(connection),
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

exception AutoSearchExn(autoSearchError);
exception ValidationExn(validationError);
exception ConnectionExn(connectionError);

/* a more sophiscated "make" */
let autoSearch = (): Js.Promise.t(string) =>
  Js.Promise.make((~resolve, ~reject) =>
    switch (OS.type_()) {
    | "Linux"
    | "Darwin" =>
      /* reject if the process hasn't responded for more than 1 second */
      let hangTimeout =
        Js.Global.setTimeout(
          () => reject(. ValidationExn(ProcessHanging)),
          1000,
        );
      ChildProcess.exec("which agda", (error, stdout, stderr) => {
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
      })
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

    ChildProcess.exec(
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
           (code, signal) => reject(. ConnectionExn(Close(code, signal))),
         ),
       )
    |> ignore;
    process
    |> ChildProcess.stdout
    |> Stream.Readable.once(
         `data(
           _ =>
             resolve(. {
               metadata,
               connection:
                 Some({
                   stdin: process |> ChildProcess.stdin,
                   stdout: process |> ChildProcess.stdout,
                   queue: [||],
                 }),
             }),
         ),
       )
    |> ignore;
  });
};

let disconnect = self => {
  /* end the stdin stream of Agda */
  switch (self.connection) {
  | None => ()
  | Some(connection) => connection.stdin |> Stream.Writable.end_ |> ignore
  };
  {metadata: self.metadata, connection: None};
};

let wire = (self): Js.Promise.t(t) => {
  switch (self.connection) {
  | None => ()
  | Some(connection) =>
    /* resolves the requests in the queue */
    let response = data => {
      Js.log(data);
      switch (connection.queue[0]) {
      | None => Js.log("WTF!!")
      | Some(req) =>
        req.resolve(data);
        /* should updates the queue */
        connection.queue |> Js.Array.pop |> ignore;
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
          Js.String.substring(
            ~from=0,
            ~to_=String.length(string) - 7,
            string,
          );
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

    connection.stdout |> Stream.Readable.on(`data(onData)) |> ignore;
  };

  Js.Promise.resolve(self);
};
