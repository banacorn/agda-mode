type miniEditor = {
  ref: option(Atom.TextEditor.t),
  focused: bool,
};

type t = {
  main: Atom.TextEditor.t,
  general: miniEditor,
};

let getFocusedEditor = editors : Atom.TextEditor.t =>
  switch (editors.general.ref) {
  | Some(editor) => editors.general.focused ? editor : editors.main
  | None => editors.main
  };
