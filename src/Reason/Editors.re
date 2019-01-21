open Rebase;
open Atom;

type sort =
  | Source
  | Query
  | Connection;

/* collection of TextEditor or MiniEditor */
type t = {
  focused: sort,
  source: TextEditor.t,
  query: MiniEditor.Model.t,
  connection: MiniEditor.Model.t,
};

exception QueryCancelled;

let make = editor => {
  focused: Source,
  source: editor,
  query: MiniEditor.Model.make(),
  connection: MiniEditor.Model.make(),
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
    | Connection =>
      switch (editors.connection.ref) {
      | Some(editor) => editor
      | None => editors.source
      }
    };

  let on = (sort, editors) =>
    switch (sort) {
    | Source =>
      if (editors.focused != Source) {
        Environment.Views.getView(editors.source) |> HtmlElement.focus;
      }
    | Query =>
      if (editors.focused != Query) {
        switch (editors.query.ref) {
        | Some(editor) =>
          Environment.Views.getView(editor) |> HtmlElement.focus
        | None => ()
        };
      }
    | Connection =>
      if (editors.focused != Connection) {
        switch (editors.connection.ref) {
        | Some(editor) =>
          Environment.Views.getView(editor) |> HtmlElement.focus
        | None => ()
        };
      }
    };
};

/* Query */
module Query = {
  let inquire = editors => editors.query.telePromise.wire();
  let answer = (x, editors) => editors.query.telePromise.resolve(x);
  let reject = (exn, editors) => editors.query.telePromise.reject(exn);
};

/* Connection */
module Connection = {
  let inquire = editors => editors.connection.telePromise.wire();
  let answer = (x, editors) => editors.connection.telePromise.resolve(x);
  let reject = (exn, editors) => editors.connection.telePromise.reject(exn);
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
