open Async;
module Event = Event;

open Instance__Type;
module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;
module Handler = Instance__Handler;

type t = Instance__Type.t;

let handleCommandError = Handler.handleCommandError;
let dispatch = Handler.dispatch;

let activate = instance => instance.view.activate();

let deactivate = instance => instance.view.deactivate();

let destroy = instance => instance.view.destroy();

let make = (textEditor: Atom.TextEditor.t) => {
  /* adds "agda" to the class-list */
  Atom.Environment.Views.getView(textEditor)
  |> Webapi.Dom.HtmlElement.classList
  |> Webapi.Dom.DomTokenList.add("agda");

  /*  */
  let editors = Editors.make(textEditor);
  let instance = {
    isLoaded: false,
    editors,
    view: Root.initialize(editors),
    goals: [||],
    history: {
      checkpoints: [||],
      needsReloading: false,
    },
    highlightings: [||],
    runningInfo: RunningInfo.make(),
    connection: None,
    dispatch: Handler.dispatch,
    handleResponse: Handler.handleResponseAndRecoverCursor,
  };

  /* listen to `onInquireConnection` */
  let destructor0 =
    instance.view.onInquireConnection
    |> Event.onOk(path =>
         Connections.connectWithAgdaPath(instance, path) |> ignore
       );
  /* listen to `onMouseEvent` */
  let destructor1 =
    instance.view.onMouseEvent
    |> Event.onOk(ev =>
         switch (ev) {
         | Type.View.Mouse.JumpToTarget(target) =>
           instance |> dispatch(Jump(target)) |> ignore
         | _ => ()
         }
       );
  instance.view.onDestroy()
  |> finalOk(_ => {
       destructor0();
       destructor1();
     });

  instance;
};

let dispatchUndo = (instance: t) => {
  // should reset goals after undo
  instance.editors.source |> Atom.TextEditor.undo;
  // reload
  if (instance.history.needsReloading) {
    instance |> dispatch(Load) |> ignore;
    instance.history.needsReloading = false;
  };
};
