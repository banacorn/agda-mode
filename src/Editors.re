open Rebase;
open Atom;

type sort =
  | Source
  | Query;

type t = {
  mutable focused: sort,
  source: TextEditor.t,
  query: MiniEditor.Model.t,
};

exception QueryCancelled;

let make = editor => {
  focused: Source,
  source: editor,
  query: MiniEditor.Model.make(),
};

module Focus = {
  open Webapi.Dom;
  let get = (editors): TextEditor.t =>
    switch (editors.focused) {
    | Source => editors.source
    | Query =>
      switch (editors.query.ref) {
      | Some(editor) => editor
      | None => editors.source
      }
    };

  let on = (sort, editors) =>
    switch (sort) {
    | Source =>
      Environment.Views.getView(editors.source) |> HtmlElement.focus;
      editors.focused = Source;
    | Query =>
      editors.query.ref |> Option.forEach(MiniEditor.focus);
      editors.focused = Query;
    };
};

let getSelectedTextNode = editors => {
  let getSelectedText = () => {
    editors |> Focus.get |> Atom.TextEditor.getSelectedText;
  };
  let getLargerSyntaxNode = () => {
    editors |> Focus.get |> Atom.TextEditor.selectLargerSyntaxNode;
    editors |> Focus.get |> Atom.TextEditor.getSelectedText;
  };
  let getPointedWord = () => {
    editors |> Focus.get |> Atom.TextEditor.selectWordsContainingCursors;
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
