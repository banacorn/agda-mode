open ReasonReact;

open Connection;

let component = statelessComponent("SettingsConnectionError");

let toString =
  fun
  | AutoSearch(NotSupported(os)) => (
      "Auto search failed",
      {j|currently auto path searching is not supported on $(os)|j},
    )
  | AutoSearch(NotFound(msg)) => ("Auto search failed", msg)
  | Validation(_path, PathMalformed(msg)) => ("Path malformed", msg)
  | Validation(_path, ProcessHanging) => (
      "Process hanging",
      "The program has not been responding for more than 1 sec",
    )
  | Validation(_path, NotFound(error)) => (
      "Agda not found",
      Util.JsError.toString(error),
    )
  | Validation(_path, ShellError(error)) => (
      "Error from the shell",
      Util.JsError.toString(error),
    )
  | Validation(_path, ProcessError(msg)) => ("Error from the stderr", msg)
  | Validation(_path, IsNotAgda(msg)) => ("This is not agda", msg)
  | Connection(_connection, ShellError(error)) => (
      "Socket error",
      Util.JsError.toString(error),
    )
  | Connection(_connection, Close(code, signal)) => (
      "Socket closed",
      {j|code: $code
signal: $signal|j},
    );

let make = (~error: option(error), _children) => {
  ...component,
  render: _self => {
    switch (error) {
    | None => null
    | Some(e) =>
      let (header, body) = toString(e);
      <>
        <hr />
        <div className="inset-panel padded text-warning error">
          <h3> {string(header)} </h3>
          <pre> {string(body)} </pre>
        </div>
      </>;
    };
  },
};
