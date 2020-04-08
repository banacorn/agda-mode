open! Rebase;

open Instance__Type;

open Task.Highlightings;
open! Atom;

/* lots of side effects! */
let add = (annotation: Highlighting.Annotation.t, instance) => {
  let textBuffer = TextEditor.getBuffer(instance.editors.source);
  let startPoint =
    textBuffer |> TextBuffer.positionForCharacterIndex(annotation.start - 1);
  let endPoint =
    textBuffer |> TextBuffer.positionForCharacterIndex(annotation.end_ - 1);
  let range = Range.make(startPoint, endPoint);
  let marker = TextEditor.markBufferRange(range, instance.editors.source);
  /* update the state */
  instance.highlightings |> Js.Array.push(marker) |> ignore;
  /* decorate */
  let types = annotation.types |> Js.Array.joinWith(" ");

  TextEditor.decorateMarker(
    marker,
    TextEditor.decorateMarkerOptions(
      ~type_="highlight",
      ~class_="highlight-decoration " ++ types,
      (),
    ),
    instance.editors.source,
  )
  |> ignore;
};

let addMany = (annotations, instance) =>
  annotations
  |> Array.filter(Highlighting.Annotation.shouldHighlight)
  |> Array.forEach(annotation => instance |> add(annotation));

let addFromFile = (filepath, instance): Promise.t(unit) => {
  let readFile = N.Fs.readFile |> N.Util.promisify;
  /* read and parse and add */
  readFile(. filepath)
  ->Promise.Js.fromBsPromise
  ->Promise.Js.toResult
  ->Promise.map(
      fun
      | Ok(content) => {
          open! Parser__Type.SExpression;
          content
          |> Node.Buffer.toString
          |> Parser.SExpression.parse
          |> Array.filterMap(Option.fromResult)  // throwing away errors
          |> Array.map(tokens =>
               switch (tokens) {
               | L(xs) =>
                 xs |> Highlighting.Annotation.parseIndirectHighlightings
               | _ => [||]
               }
             )
          |> Array.flatMap(x => x)
          |> Array.filter(Highlighting.Annotation.shouldHighlight)
          |> Array.forEach(annotation => instance |> add(annotation));
          ();
        }
      | Error(err) => {
          Js.log(err);
          Js.log("cannot read the indirect highlighting file: " ++ filepath);
        },
    );
};

let destroyAll = instance => {
  instance.highlightings |> Array.forEach(DisplayMarker.destroy);
  instance.highlightings = [||];
};

let execute = instance =>
  fun
  | AddDirectly(annotations) => {
      addMany(annotations, instance);
      Promise.resolved([||]);
    }
  | AddIndirectly(filepath) => {
      // read the file
      addFromFile(filepath, instance)
      // delete the file
      ->Promise.map(() => Ok(N.Fs.unlink(filepath, _ => ())))
      ->Promise.map(_ => [||]);
    };
