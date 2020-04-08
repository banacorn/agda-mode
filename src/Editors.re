open Belt;

type sort =
  | Source
  | Query;

type t = {
  mutable focused: sort,
  source: Atom.TextEditor.t,
  mutable query: option(Atom.TextEditor.t),
};

let make = editor => {focused: Source, source: editor, query: None};

let getID = self => string_of_int(Atom.TextEditor.id(self.source));

module Focus = {
  open Atom;
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
      editors.source->Views.getView->HtmlElement.focus;
      editors.focused = Source;
    | Query =>
      editors.query
      ->Option.map(Atom.Views.getView)
      ->Option.forEach(HtmlElement.focus);
      editors.focused = Query;
    };
};

module Selection = {
  let getSymbol = editors => {
    editors
    ->Focus.get
    ->Atom.TextEditor.getSelectedText
    ->Js.String.substrAtMost(~from=0, ~length=1);
  };
  let getTextNode = editors => {
    let getText = () => {
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

    let selectedText = getText();

    // if the user didn't select anything
    if (selectedText == "") {
      let largerNode = getLargerSyntaxNode();
      // this happens when language-agda is not installed
      if (largerNode == "") {
        getPointedWord();
      } else {
        let pointedText = getPointedWord();
        // this happens when the user is hovering on a mixfix/infix operator like _+_
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
};