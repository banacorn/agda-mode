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

let activate = instance =>
  // only activate the view when it's loaded
  if (instance.isLoaded) {
    instance.view.activate() |> thenOk(_ => resolve());
  } else {
    resolve();
  };

let deactivate = instance =>
  // only deactivate the view when it's loaded
  if (instance.isLoaded) {
    instance.view.deactivate() |> thenOk(_ => resolve());
  } else {
    resolve();
  };

let destroy = instance => instance.view.destroy();

let make = (textEditor: Atom.TextEditor.t) => {
  /* adds "agda" to the class-list */
  Atom.Views.getView(textEditor)
  |> Webapi.Dom.HtmlElement.classList
  |> Webapi.Dom.DomTokenList.add("agda");

  /*  */
  let editors = Editors.make(textEditor);
  let view = Root.initialize(editors);
  let instance = {
    isLoaded: false,
    editors,
    view,
    goals: [||],
    history: {
      checkpoints: [||],
      needsReloading: false,
    },
    highlightings: [||],
    runningInfo: RunningInfo.make(),
    connection: None,
    handleResponse: Handler.handleResponseAndRecoverCursor,
    dispatch: Handler.dispatch,
    onDispatch: Event.make(),
    onConnectionError: Event.make(),
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

  instance.view.onDestroy
  |> Event.once
  |> Async.finalOk(_ => {
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

let getID = (instance: t): string => {
  instance.editors |> Editors.getID;
};
