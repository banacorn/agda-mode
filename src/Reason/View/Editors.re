open Webapi.Dom;

type miniEditor = {
  value: string,
  placeholder: string,
  ref: option(Atom.TextEditor.t),
  telePromise: Util.TelePromise.t(string),
};

type sort =
  | Main
  | General;

type t = {
  focused: sort,
  main: Atom.TextEditor.t,
  query: miniEditor,
};

exception QueryCancelled;

let make = editor => {
  focused: Main,
  main: editor,
  query: {
    value: "",
    placeholder: "",
    ref: None,
    telePromise: Util.TelePromise.make(),
  },
};

let getFocusedEditor = editors : Atom.TextEditor.t =>
  switch (editors.focused) {
  | Main => editors.main
  | General =>
    switch (editors.query.ref) {
    | Some(editor) => editor
    | None => editors.main
    }
  };

let focusMain = editors =>
  switch (editors.focused) {
  | Main => ()
  | _ =>
    let element = Atom.Environment.Views.getView(editors.main);
    HtmlElement.focus(element);
  };

let focusGeneral = editors =>
  switch (editors.focused) {
  | General => ()
  | _ =>
    switch (editors.query.ref) {
    | Some(editor) =>
      let element = Atom.Environment.Views.getView(editor);
      HtmlElement.focus(element);
    | None => ()
    }
  };

let query = editors => editors.query.telePromise.wire();

let answer = editors => editors.query.telePromise.resolve;

let reject = editors => editors.query.telePromise.reject;
