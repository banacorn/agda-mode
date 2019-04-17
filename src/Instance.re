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

let activate = instance => View.Handles.activate(instance.view);

let deactivate = instance => View.Handles.deactivate(instance.view);

let destroy = instance => {
  View.Handles.destroy(instance.view);
};

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
    view: View.initialize(editors),
    goals: [||],
    highlightings: [||],
    runningInfo: RunningInfo.make(),
    connection: None,
    dispatch: Handler.dispatch,
    handleResponses: Handler.handleResponses,
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
         | Type.View.JumpToTarget(target) =>
           instance |> dispatch(Jump(target)) |> ignore
         | _ => ()
         }
       );
  instance.view.destroy
  |> Event.once
  |> finalOk(_ => {
       destructor0();
       destructor1();
     });

  instance;
};

let dispatchUndo = _instance => {
  Js.log("Undo");
};
