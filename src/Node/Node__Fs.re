[@bs.module "fs"]
external access: (string, option(Js.Exn.t) => unit) => unit = "";
[@bs.module "fs"]
external readFile: (string, (Js.Exn.t, Node.Buffer.t) => unit) => unit = "";
[@bs.module "fs"] external unlink: (string, Js.Exn.t => unit) => unit = "";
