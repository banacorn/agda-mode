open ReasonReact;

open Connection;

let component = statelessComponent("SettingsConnectionError");

let toString =
  fun
  | AutoSearchError(ProcessHanging) => (
      "Process not responding",
      {j|Please restart the process|j},
    )
  | AutoSearchError(NotSupported(os)) => (
      "Auto search failed",
      {j|currently auto path searching is not supported on $(os)|j},
    )
  | AutoSearchError(NotFound(msg)) => ("Auto search failed", msg)
  | ValidationError(_path, PathMalformed(msg)) => ("Path malformed", msg)
  | ValidationError(_path, ProcessHanging) => (
      "Process hanging",
      "The program has not been responding for more than 1 sec",
    )
  | ValidationError(_path, NotFound(error)) => (
      "Agda not found",
      Util.JsError.toString(error),
    )
  | ValidationError(_path, ShellError(error)) => (
      "Error from the shell",
      Util.JsError.toString(error),
    )
  | ValidationError(_path, ProcessError(msg)) => (
      "Error from the stderr",
      msg,
    )
  | ValidationError(_path, IsNotAgda(msg)) => ("This is not agda", msg)
  | ConnectionError(ShellError(error)) => (
      "Socket error",
      Util.JsError.toString(error),
    )
  | ConnectionError(ClosedByProcess(code, signal)) => (
      "Socket closed",
      {j|code: $code
signal: $signal|j},
    )
  | ConnectionError(DisconnectedByUser) => (
      "Disconnected",
      "Connection disconnected by ourselves",
    );

let make = (~error: error, _children) => {
  ...component,
  render: _self => {
    let (header, body) = toString(error);
    <>
      <hr />
      <h2> {string("Error: " ++ header)} </h2>
      <p> {string("error message:")} </p>
      <pre className="inset-panel padded text-warning error">
        {string(body)}
      </pre>
    </>;
  },
};
