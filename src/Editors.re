open Rebase;
open Atom;

type sort =
  | Source
  | Query;

type t = {
  mutable focused: sort,
  source: TextEditor.t,
  mutable query: option(Atom.TextEditor.t),
};

exception QueryCancelled;

let make = editor => {focused: Source, source: editor, query: None};

let getID = self => self.source |> Atom.TextEditor.id |> string_of_int;

module Focus = {
  open Webapi.Dom;
  let get = (editors): TextEditor.t =>
    switch (editors.focused) {
    | Source => editors.source
    | Query =>
      switch (editors.query) {
      | Some(editor) => editor
      | None => editors.source
      }
    };

  let on = (sort, editors) =>
    switch (sort) {
    | Source =>
      Views.getView(editors.source) |> HtmlElement.focus;
      editors.focused = Source;
    | Query =>
      editors.query
      |> Option.map(Atom.Views.getView)
      |> Option.forEach(HtmlElement.focus);
      editors.focused = Query;
    };
};

let getSelectedSymbol = editors => {
  editors
  |> Focus.get
  |> Atom.TextEditor.getSelectedText
  |> String.sub(~from=0, ~length=1);
};
let getSelectedTextNode = editors => {
  let getSelectedText = () => {
    editors |> Focus.get |> Atom.TextEditor.getSelectedText;
  };
  let getLargerSyntaxNode = () => {
    editors |> Focus.get |> Atom.TextEditor.selectLargerSyntaxNode |> ignore;
    editors |> Focus.get |> Atom.TextEditor.getSelectedText;
  };
  let getPointedWord = () => {
    editors
    |> Focus.get
    |> Atom.TextEditor.selectWordsContainingCursors
    |> ignore;
    editors |> Focus.get |> Atom.TextEditor.getSelectedText;
  };

  let selectedText = getSelectedText();

  /* if the user didn't select anything */
  if (String.isEmpty(selectedText)) {
    let largerNode = getLargerSyntaxNode();
    /* this happens when language-agda is not installed */
    if (String.isEmpty(largerNode)) {
      getPointedWord();
    } else {
      let pointedText = getPointedWord();
      /* this happens when the user is hovering on a mixfix/infix operator like _+_ */
      if (pointedText == "_") {
        getLargerSyntaxNode();
      } else {
        pointedText;
      };
    };
  } else {
    selectedText;
  };
};
