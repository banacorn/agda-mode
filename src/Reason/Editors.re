open Rebase;
open Atom;

type sort =
  | Source
  | Query;

/* collection of TextEditor or MiniEditor */
/* type connection = {
     model: MiniEditor.Model.t,
     message: string,
   }; */

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

module Goals = {
  type t = list(Goal.t);
  let destroy = (index, self) => {
    self
    |> Array.filter(x => Goal.(x.index) == index)
    |> Array.forEach(x => Goal.destroy(x));
    self |> Array.filter(x => Goal.(x.index) != index);
  };

  let destroyAll = self => {
    self |> Array.forEach(x => Goal.destroy(x));
    [];
  };

  let find = (index, self) => {
    let result = self |> Array.filter(x => Goal.(x.index) == index);
    result[0];
  };
  /* returns the goal where the cursor is positioned */
  let pointingAt = (cursor, self) => {
    let result =
      self
      |> Array.filter(x =>
           Goal.(x.range) |> Range.containsPoint_(cursor, false)
         );
    result[0];
  };
};
/* TODO: remove this */
let jsGoalsDestroy = Goals.destroy;
let jsGoalsDestroyAll = Goals.destroyAll;
let jsGoalsFind = Goals.find;
let jsGoalsPointingAt = Goals.pointingAt;
