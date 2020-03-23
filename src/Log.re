open Belt;
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
  let make = cmd => {
    request: cmd,
    response: {
      rawText: [||],
      sexpression: [||],
      response: [||],
      error: [||],
    },
  };
  let serialize = (i, self) => {
    // indent some paragraph by 4 spaces
    let indent = xs =>
      xs
      ->Js.String.splitByRe([%re "/\\n/"], _)
      ->Array.map(Option.mapWithDefault(_, "", x => "    " ++ x))
      ->Js.String.concatMany("\n");
    let fold = (text, title) => {j|<details><summary> $title </summary>
<p>

$text

</p>
</details>
|j};
    let quote = (xs, title) =>
      xs
      ->Array.map(x => {j|```
$x
```
|j})
      ->Js.String.concatMany("\n")
      ->fold(title)
      ->indent;

    let request = Request.toString(self.request);

    let rawText = self.response.rawText->quote("raw text");
    let sexpression =
      self.response.sexpression
      ->Array.map(Parser.SExpression.toString)
      ->quote("s-expression");
    let response =
      self.response.response
      ->Array.map(Response.toString)
      ->quote("response");
    let error =
      self.response.error->Array.map(Parser.Error.toString)->quote("error");

    {j|$i. **$request**
$rawText
$sexpression
$response
$error
|j};
  };
};

type t = array(Entry.t);

let createEntry = (cmd, log) => {
  let entry = Entry.make(cmd);
  Js.Array.push(entry, log) |> ignore;
};

let updateLatestEntry = (f: Entry.t => unit, log) => {
  let n = Array.length(log);
  let lastEntry = log[n - 1];
  lastEntry->Option.forEach(f);
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

let serialize = x =>
  x->Array.mapWithIndex(Entry.serialize)->Js.String.concatMany("\n");