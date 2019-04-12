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
    /* | Connection =>
       switch (editors.connection.model.ref) {
       | Some(editor) => editor
       | None => editors.source
       } */
    };

  let on = (sort, editors) =>
    switch (sort) {
    | Source =>
      Environment.Views.getView(editors.source) |> HtmlElement.focus;
      editors.focused = Source;
    | Query =>
      editors.query.ref |> Option.forEach(MiniEditor.focus);
      editors.focused = Query;
    /* | Connection =>
       if (editors.focused != Connection) {
         editors.connection.model |> MiniEditor.Model.focus;
       } */
    };
};

let pointingAt = (~cursor=?, goals, editors): option(Goal.t) => {
  let cursor_ =
    switch (cursor) {
    | None => editors.source |> TextEditor.getCursorBufferPosition
    | Some(x) => x
    };

  let pointedGoals =
    goals
    |> Array.filter(goal => goal.Goal.range |> Range.containsPoint(cursor_));
  /* return the first pointed goal */
  pointedGoals[0];
};
