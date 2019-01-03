open Webapi.Dom;

type sort =
  | Source
  | Query;

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

let getFocusedEditor = editors : Atom.TextEditor.t =>
  switch (editors.focused) {
  | Source => editors.source
  | Query =>
    switch (editors.query.ref) {
    | Some(editor) => editor
    | None => editors.source
    }
  };

let focusSource = editors =>
  switch (editors.focused) {
  | Source => ()
  | _ =>
    let element = Atom.Environment.Views.getView(editors.query);
    HtmlElement.focus(element);
  };

let focusQuery = editors =>
  switch (editors.focused) {
  | Query => ()
  | _ =>
    switch (editors.query.ref) {
    | Some(editor) =>
      let element = Atom.Environment.Views.getView(editor);
      HtmlElement.focus(element);
    | None => ()
    }
  };

let inquire = editors => editors.query.telePromise.wire();

let answer = editors => editors.query.telePromise.resolve;

let reject = editors => editors.query.telePromise.reject;
