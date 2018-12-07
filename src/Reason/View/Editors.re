open Webapi.Dom;

type miniEditor = {
  value: string,
  placeholder: string,
  ref: option(Atom.TextEditor.t),
  focused: bool,
  telePromise: Util.TelePromise.t(string),
};

type t = {
  main: Atom.TextEditor.t,
  general: miniEditor,
};

exception QueryCanceled;

let make = editor => {
  main: editor,
  general: {
    value: "",
    placeholder: "",
    ref: None,
    focused: false,
    telePromise: Util.TelePromise.make(),
  },
};

let getFocusedEditor = editors : Atom.TextEditor.t =>
  switch (editors.general.ref) {
  | Some(editor) => editors.general.focused ? editor : editors.main
  | None => editors.main
  };

let focusMain = editors => {
  let element = Atom.Environment.Views.getView(editors.main);
  HtmlElement.focus(element);
};

let focusGeneral = editors =>
  switch (editors.general.ref) {
  | Some(editor) =>
    let element = Atom.Environment.Views.getView(editor);
    HtmlElement.focus(element);
  | None => ()
  };

let queryGeneral = editors => editors.general.telePromise.wire();

let answerGeneral = editors => editors.general.telePromise.resolve;

let rejectGeneral = editors => editors.general.telePromise.reject;
