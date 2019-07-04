open Rebase;
open Atom;
open Async;

type t = {
  mutable editor: option(TextEditor.t),
  mutable isOpeningEditor: bool,
  mutable buffer: list(string),
  mutable subscriptions: CompositeDisposable.t,
};
let make = () => {
  editor: None,
  isOpeningEditor: false,
  buffer: [],
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
  self.buffer = [];
  self.subscriptions |> CompositeDisposable.dispose;
};

let add = (info, self) =>
  switch (self.editor) {
  | Some(editor) =>
    editor |> TextEditor.insertText(info) |> ignore;
    resolve();
  | None =>
    if (self.isOpeningEditor) {
      self.buffer = [info, ...self.buffer];
      resolve();
    } else {
      self.isOpeningEditor = true;
      let itemURI = "agda-mode://running-info";
      Environment.Workspace.open_(itemURI, itemOptions)
      |> fromPromise
      |> thenOk(newItem => {
           self.isOpeningEditor = false;
           // register the newly opened editor
           self.editor = Some(newItem);
           // insert logs in buffer to the editor and clean the buffer
           newItem
           |> TextEditor.insertText(String.join(self.buffer))
           |> ignore;
           self.buffer = [];
           // destroy everything on close
           newItem
           |> TextEditor.onDidDestroy(() => self |> destroy)
           |> CompositeDisposable.add(self.subscriptions);
           resolve();
         });
    }
  };
