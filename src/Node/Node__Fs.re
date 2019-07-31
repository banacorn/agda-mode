[@bs.module "fs"]
external access: (string, Js.Nullable.t(Js.Exn.t) => unit) => unit = "access";
[@bs.module "fs"]
external readFile: (string, (Js.Exn.t, Node.Buffer.t) => unit) => unit =
  "readFile";
[@bs.module "fs"]
external unlink: (string, Js.Exn.t => unit) => unit = "unlink";
