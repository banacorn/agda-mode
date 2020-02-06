open Rebase;
open Rebase.Fn;

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

module Log = {
  module Entry = {
    type request = Command.Remote.command;
    type response = {
      mutable rawText: array(string),
      mutable sexpression: array(Parser.SExpression.t),
      mutable response: array(Response.t),
      mutable error: array(Parser.Error.t),
    };
    type t = {
      request,
      response,
    };
    let serialize = (self, i) => {
      // indent some paragraph by 4 spaces
      let indent = xs =>
        xs
        |> Util.safeSplitByRe([%re "/\\n/"])
        |> Array.map(Option.mapOr(x => "    " ++ x, ""))
        |> List.fromArray
        |> String.joinWith("\n");
      let fold = (title, text) => {j|<details><summary> $title </summary>
<p>

$text

</p>
</details>
|j};
      let quote = (title, xs) =>
        xs
        |> Array.map(x => {j|```
$x
```
|j})
        |> List.fromArray
        |> String.joinWith("\n")
        |> fold(title)
        |> indent;

      let request = Command.Remote.toString(self.request);

      let rawText = self.response.rawText |> quote("raw text");
      let sexpression =
        self.response.sexpression
        |> Array.map(Parser.SExpression.toString)
        |> quote("s-expression");
      let response =
        self.response.response
        |> Array.map(Response.toString)
        |> quote("response");
      let error =
        self.response.error
        |> Array.map(Parser.Error.toString)
        |> quote("error");

      {j|$i. **$request**
$rawText
$sexpression
$response
$error
|j};
    };
  };

  let empty = [||];

  let createEntry = (cmd, log) => {
    let entry: Entry.t = {
      request: cmd,
      response: {
        rawText: [||],
        sexpression: [||],
        response: [||],
        error: [||],
      },
    };
    Js.Array.push(entry, log) |> ignore;
  };

  let updateLatestEntry = (f: Entry.t => unit, log) => {
    let n = Array.length(log);
    let lastEntry = log[n - 1];
    lastEntry |> Option.forEach(f);
  };

  let logRawText = text =>
    updateLatestEntry(entry =>
      Js.Array.push(text, entry.response.rawText) |> ignore
    );

  let logSExpression = text =>
    updateLatestEntry(entry =>
      Js.Array.push(text, entry.response.sexpression) |> ignore
    );

  let logResponse = text =>
    updateLatestEntry(entry =>
      Js.Array.push(text, entry.response.response) |> ignore
    );

  let logError = text =>
    updateLatestEntry(log =>
      Js.Array.push(text, log.response.error) |> ignore
    );

  let serialize =
    Array.mapi(Entry.serialize) >> List.fromArray >> String.joinWith("\n");
};

type t = {
  path: string,
  args: array(string),
  version: string,
  protocol: Protocol.t,
  mutable entries: array(Log.Entry.t),
};

let createLogEntry = (cmd, metadata) =>
  Log.createEntry(cmd, metadata.entries);

let updateLatestEntry = (f: Log.Entry.t => unit, self) =>
  Log.updateLatestEntry(f, self.entries);

let logRawText = (text, self) => Log.logRawText(text, self.entries);
let logSExpression = (text, self) => Log.logSExpression(text, self.entries);
let logResponse = (text, self) => Log.logResponse(text, self.entries);
let logError = (text, self) => Log.logError(text, self.entries);

let serialize = self => {
  let path = "* path: " ++ self.path;
  let args = "* args: " ++ Util.Pretty.array(self.args);
  let version = "* version: " ++ self.version;
  let protocol = "* protocol: " ++ Protocol.toString(self.protocol);
  let os = "* platform: " ++ N.OS.type_();
  let entries = self.entries |> Log.serialize;

  {j|## Parse Log
$path
$args
$version
$protocol
$os
$entries
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