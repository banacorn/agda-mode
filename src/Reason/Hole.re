open Atom;

type t = {
  range: Atom.Range.t,
  marker: Atom.DisplayMarker.t,
  content: string,
};

/* lots of side effects! */
let make = (editor: TextEditor.t, index: option(int), range: Range.t) => {};
