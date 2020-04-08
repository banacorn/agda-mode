module Event = Event;

open Instance__Type;
module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;

type t = Instance__Type.t;

let activate = instance =>
  // only activate the view when it's loaded
  if (instance.isLoaded) {
    instance.view.activate();
  } else {
    Promise.resolved();
  };

let deactivate = instance =>
  // only deactivate the view when it's loaded
  if (instance.isLoaded) {
    instance.view.deactivate();
  } else {
    Promise.resolved();
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
    onDispatch: Event.make(),
    onConnectionError: Event.make(),
  };

  // subscribe to `onMouseEvent`
  let destructor1 =
    instance.view.onMouseEvent.on(ev =>
      switch (ev) {
      | Type.View.Mouse.JumpToTarget(target) =>
        TaskRunner.dispatchCommand(Jump(target), instance) |> ignore
      | _ => ()
      }
    );
  // unsubscribe to `onMouseEvent`
  instance.view.onDestroy.once()->Promise.get(_ => destructor1());

  instance;
};

let dispatchUndo = (instance: t) => {
  // should reset goals after undo
  instance.editors.source |> Atom.TextEditor.undo;
  // reload
  if (instance.history.needsReloading) {
    TaskRunner.dispatchCommand(Load, instance) |> ignore;
    instance.history.needsReloading = false;
  };
};

let getID = (instance: t): string => {
  instance.editors |> Editors.getID;
};
