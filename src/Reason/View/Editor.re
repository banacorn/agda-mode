open Webapi.Dom;

type sort =
  | Source
  | Query;

/* collection of Atom.TextEditor or MiniEditor */
type t = {
  focused: sort,
  source: Atom.TextEditor.t,
  query: MiniEditor.model,
};

exception QueryCancelled;

let make = editor => {
  focused: Source,
  source: editor,
  query: MiniEditor.makeModel(),
};

module Focus = {
  let get = editor : Atom.TextEditor.t =>
    switch (editor.focused) {
    | Source => editor.source
    | Query =>
      switch (editor.query.ref) {
      | Some(editor) => editor
      | None => editor.source
      }
    };
  /* Focus on the Source Editor */
  let onSource = editor =>
    switch (editor.focused) {
    | Source => ()
    | _ =>
      let element = Atom.Environment.Views.getView(editor.query);
      HtmlElement.focus(element);
    };
  /* Focus on the Query Editor */
  let onQuery = editor =>
    switch (editor.focused) {
    | Query => ()
    | _ =>
      switch (editor.query.ref) {
      | Some(editor) =>
        let element = Atom.Environment.Views.getView(editor);
        HtmlElement.focus(element);
      | None => ()
      }
    };
};

/* Query */
module Query = {
  let inquire = editor => editor.query.telePromise.wire();
  let answer = editor => editor.query.telePromise.resolve;
  let reject = editor => editor.query.telePromise.reject;
};
/* Source */
/* let jumpToRange = (editor, range) => {
     editor |> focusSource;
     Type.Syntax.Position.(
       switch (range) {
       | NoRange => ()
       | Range(srcFile, intervals) => ()
       }
     );
   }; */
