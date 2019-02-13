open Rebase;
open Atom;

type sort =
  | Source
  | Query;

type t = {
  mutable focused: sort,
  source: TextEditor.t,
  query: MiniEditor.Model.t,
  /* connection, */
};

exception QueryCancelled;

let make = editor => {
  focused: Source,
  source: editor,
  query: MiniEditor.Model.make(),
  /* connection: {
       model: MiniEditor.Model.make(),
       message: "",
     }, */
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
      if (editors.focused != Source) {
        Environment.Views.getView(editors.source) |> HtmlElement.focus;
      }
    | Query =>
      if (editors.focused != Query) {
        editors.query.ref |> Option.forEach(MiniEditor.focus);
      }
    /* | Connection =>
       if (editors.focused != Connection) {
         editors.connection.model |> MiniEditor.Model.focus;
       } */
    };
};

let pointingAt = (goals, editors): option(Goal.t) => {
  let cursor = editors.source |> TextEditor.getCursorBufferPosition;
  let pointedGoals =
    goals
    |> Array.filter(goal => goal.Goal.range |> Range.containsPoint(cursor));
  /* return the first pointed goal */
  pointedGoals[0];
};
