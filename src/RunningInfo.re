open Atom;

type t = {
  mutable editor: option(TextEditor.t),
  mutable isOpeningEditor: bool,
  mutable buffer: array(string),
  mutable subscriptions: CompositeDisposable.t,
};
let make = () => {
  editor: None,
  isOpeningEditor: false,
  buffer: [||],
  subscriptions: CompositeDisposable.make(),
};

let itemOptions = {
  "initialLine": 0,
  "initialColumn": 0,
  "split": "right",
  "activatePane": false,
  "activateItem": false,
  "pending": false,
  "searchAllPanes": true,
  "location": (None: option(string)),
};

let destroy = self => {
  self.editor = None;
  self.isOpeningEditor = false;
  self.buffer = [||];
  self.subscriptions |> CompositeDisposable.dispose;
};

let add = (info, self) =>
  switch (self.editor) {
  | Some(editor) =>
    editor |> TextEditor.insertText(info) |> ignore;
    Promise.resolved();
  | None =>
    if (self.isOpeningEditor) {
      Js.Array.unshift(info, self.buffer) |> ignore;
      Promise.resolved();
    } else {
      self.isOpeningEditor = true;
      let itemURI = "agda-mode://running-info";

      Workspace.open_(itemURI, itemOptions)
      ->Promise.Js.fromBsPromise
      ->Promise.Js.toResult
      ->Promise.mapOk(newItem => {
          self.isOpeningEditor = false;
          // register the newly opened editor
          self.editor = Some(newItem);
          // insert logs in buffer to the editor and clean the buffer
          TextEditor.insertText(
            Js.String.concatMany(self.buffer, ""),
            newItem,
          )
          |> ignore;
          // empty the buffer
          self.buffer = [||];
          // destroy everything on close

          TextEditor.onDidDestroy(() => self |> destroy, newItem)
          |> CompositeDisposable.add(self.subscriptions);
        })
      ->Promise.map(_ => ());
    }
  };