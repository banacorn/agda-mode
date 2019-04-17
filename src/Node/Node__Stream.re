module Type = {
  module Readable = {
    type t;
  };
  module Writable = {
    type t;
  };
};

module Writable = {
  type t = Type.Writable.t;
  type listener = [
    | `close(unit => unit)
    | `drain(unit => unit)
    | `error(Js.Exn.t => unit)
    | `finish(unit => unit)
    | `pipe(Type.Readable.t => unit)
    | `unpipe(Type.Readable.t => unit)
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
  type t = Type.Readable.t;
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
  [@bs.send.pipe: t] external pipe: Type.Writable.t => Type.Writable.t = "";
  [@bs.send.pipe: t]
  external pipe_: (Type.Writable.t, {. "end": bool}) => Type.Writable.t =
    "pipe";
  [@bs.send.pipe: t] [@bs.send.pipe: t] external read: Node.Buffer.t = "";
  [@bs.send.pipe: t] external read_: int => Node.Buffer.t = "read";
  [@bs.send.pipe: t] external readable: bool = "";
  [@bs.send.pipe: t] external readableHighWaterMark: int = "";
  [@bs.send.pipe: t] external readableLength: int = "";
  [@bs.send.pipe: t] external resume: t = "";
  [@bs.send.pipe: t] external setEncoding: string => t = "";
  [@bs.send.pipe: t] external unpipe: Type.Writable.t => t = "";
  [@bs.send.pipe: t] external unshift: Node.Buffer.t => unit = "";
  /* [@bs.send.pipe: t] external wrap: Stream.t => unit = ""; */
};
