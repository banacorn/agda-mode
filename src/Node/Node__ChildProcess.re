/* Node Child Process API */

module Stream = Nd.Stream;

type t;

[@bs.get] external stdout: t => Stream.Readable.t = "stdout";
[@bs.get] external stderr: t => Stream.Readable.t = "stderr";
[@bs.get] external stdin: t => Stream.Writable.t = "stdin";
/* [@bs.send.pipe: t] external disconnect: unit = ""; */
[@bs.send.pipe: t] external kill: string => unit = "kill";

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
  "on";

type execCallback =
  (Js.Nullable.t(Js.Exn.t), Node.Buffer.t, Node.Buffer.t) => unit;
[@bs.module "child_process"]
external exec: (string, execCallback) => t = "exec";
type spawnOption = {. "shell": bool};

[@bs.module "child_process"]
external spawn: (string, array(string), spawnOption) => t = "spawn";
