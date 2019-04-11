/* Node Child Process API */

module Stream = Node__Stream;

type t;

[@bs.get] external stdout: t => Stream.Readable.t = "";
[@bs.get] external stdin: t => Stream.Writable.t = "";
/* [@bs.send.pipe: t] external disconnect: unit = ""; */
[@bs.send.pipe: t] external kill: string => unit = "";

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
