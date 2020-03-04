open Rebase;
open Rebase.Fn;

module Entry = {
  type request = Request.t;
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

    let request = Request.toString(self.request);

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

type t = array(Entry.t);

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
  updateLatestEntry(log => Js.Array.push(text, log.response.error) |> ignore);

let serialize =
  Array.mapi(Entry.serialize) >> List.fromArray >> String.joinWith("\n");
