open Rebase;

/* supported protocol */
module Protocol = {
  type t =
    | EmacsOnly
    | EmacsAndJSON;
  let toString =
    fun
    | EmacsOnly => "Emacs"
    | EmacsAndJSON => "Emacs / JSON";
};

type t = {
  path: string,
  args: array(string),
  version: string,
  protocol: Protocol.t,
};

let serialize = self => {
  let path = "* path: " ++ self.path;
  let args = "* args: " ++ Util.Pretty.array(self.args);
  let version = "* version: " ++ self.version;
  let protocol = "* protocol: " ++ Protocol.toString(self.protocol);
  let os = "* platform: " ++ N.OS.type_();

  {j|## Parse Log
$path
$args
$version
$protocol
$os
  |j};
};

let dump = self => {
  let text = serialize(self);
  let itemOptions = {
    "initialLine": 0,
    "initialColumn": 0,
    "split": "left",
    "activatePane": true,
    "activateItem": true,
    "pending": false,
    "searchAllPanes": true,
    "location": (None: option(string)),
  };
  let itemURI = "agda-mode://log.md";
  Atom.Workspace.open_(itemURI, itemOptions)
  ->Promise.Js.fromBsPromise
  ->Promise.Js.toResult
  ->Promise.map(
      fun
      | Error(_) => ()
      | Ok(newItem) => {
          newItem |> Atom.TextEditor.insertText(text) |> ignore;
        },
    )
  |> ignore;
};