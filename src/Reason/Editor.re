open Rebase;
open Atom;

type sort =
  | Source
  | Query;

/* collection of TextEditor or MiniEditor */
type t = {
  focused: sort,
  source: TextEditor.t,
  query: MiniEditor.model,
};

exception QueryCancelled;

let make = editor => {
  focused: Source,
  source: editor,
  query: MiniEditor.makeModel(),
};

module Focus = {
  open Webapi.Dom;
  let get = (editor): TextEditor.t =>
    switch (editor.focused) {
    | Source => editor.source
    | Query =>
      switch (editor.query.ref) {
      | Some(editor) => editor
      | None => editor.source
      }
    };
  /* Focus on the Source Editor */
  let onSource = editor =>
    switch (editor.focused) {
    | Source => ()
    | _ =>
      let element = Environment.Views.getView(editor.query);
      HtmlElement.focus(element);
    };
  /* Focus on the Query Editor */
  let onQuery = editor =>
    switch (editor.focused) {
    | Query => ()
    | _ =>
      switch (editor.query.ref) {
      | Some(editor) =>
        let element = Environment.Views.getView(editor);
        HtmlElement.focus(element);
      | None => ()
      }
    };
};

/* Query */
module Query = {
  let inquire = editor => editor.query.telePromise.wire();
  let answer = editor => editor.query.telePromise.resolve;
  let reject = editor => editor.query.telePromise.reject;
};

module Goals = {
  type t = list(Hole.t);
  let destroy = (index, self) => {
    self
    |> Array.filter(x => Hole.(x.index) == index)
    |> Array.forEach(x => Hole.destroy(x));
    self |> Array.filter(x => Hole.(x.index) != index);
  };

  let destroyAll = self => {
    self |> Array.forEach(x => Hole.destroy(x));
    [];
  };

  let find = (index, self) => {
    let result = self |> Array.filter(x => Hole.(x.index) == index);
    result[0];
  };
  /* returns the goal where the cursor is positioned */
  let pointingAt = (cursor, self) => {
    let result =
      self
      |> Array.filter(x =>
           Hole.(x.range) |> Range.containsPoint_(cursor, false)
         );
    result[0];
  };
};
/* TODO: remove this */
let jsGoalsDestroy = Goals.destroy;
let jsGoalsDestroyAll = Goals.destroyAll;
let jsGoalsFind = Goals.find;
let jsGoalsPointingAt = Goals.pointingAt;
