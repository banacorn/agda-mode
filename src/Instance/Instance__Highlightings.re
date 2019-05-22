open Rebase;
open Async;

open Instance__Type;

open Atom;

/* lots of side effects! */
let add = (annotation: Highlighting.Annotation.t, instance) => {
  let textEditor = instance.editors.source;
  let textBuffer = textEditor |> TextEditor.getBuffer;
  let startPoint =
    textBuffer |> TextBuffer.positionForCharacterIndex(annotation.start - 1);
  let endPoint =
    textBuffer |> TextBuffer.positionForCharacterIndex(annotation.end_ - 1);
  let range = Range.make(startPoint, endPoint);
  let marker = textEditor |> TextEditor.markBufferRange(range);
  /* update the state */
  instance.highlightings |> Js.Array.push(marker) |> ignore;
  /* decorate */
  let types = annotation.types |> Js.Array.joinWith(" ");
  textEditor
  |> TextEditor.decorateMarker(
       marker,
       TextEditor.decorationParams(
         ~type_="highlight",
         ~class_="highlight-decoration " ++ types,
         (),
       ),
     )
  |> ignore;
};

let addFromFile = (filepath, instance): Async.t(unit, unit) => {
  let readFile = N.Fs.readFile |> N.Util.promisify;
  /* read and parse and add */
  readFile(. filepath)
  |> fromPromise
  |> thenOk(content => {
       open Parser.SExpression;
       content
       |> Node.Buffer.toString
       |> Parser.SExpression.parse
       |> Result.map(tokens =>
            switch (tokens) {
            | L(xs) => xs |> Highlighting.Annotation.parseIndirectHighlightings
            | _ => [||]
            }
          )
       |> Result.forEach(annotations =>
            annotations
            |> Array.filter(Highlighting.Annotation.shouldHighlight)
            |> Array.forEach(annotation => instance |> add(annotation))
          );
       resolve();
     })
  /* print on error */
  |> mapError(err => {
       Js.log(err);
       Js.log("cannot read the indirect highlighting file: " ++ filepath);
     });
};

let destroyAll = instance => {
  instance.highlightings |> Array.forEach(DisplayMarker.destroy);
  instance.highlightings = [||];
};
