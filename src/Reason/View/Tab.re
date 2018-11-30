open ReasonReact;

open Webapi.Dom;

open Js.Promise;

open Atom;

type itemDescriptor = {
  .
  "element": ElementRe.t,
  "getURI": unit => string,
  "getTitle": unit => string,
  "getDefaultLocation": unit => string,
};

let createItemDescriptor = (editor: TextEditor.t) : itemDescriptor => {
  open DomTokenListRe;
  let element = document |> Document.createElement("article");
  element |> Element.classList |> add("agda-mode");
  let uri = "agda-mode://" ++ TextEditor.getPath(editor);
  let title = "[Agda Mode] " ++ TextEditor.getTitle(editor);
  {
    "element": element,
    "getURI": () => uri,
    "getTitle": () => title,
    "getDefaultLocation": () => "right",
  };
};

type state = {
  item: option(TextEditor.t),
  closedDeliberately: bool,
};

type action =
  | Open
  | Kill
  | Activate
  | UpdatePaneItem(TextEditor.t);

type retainedProps = {
  open_: bool,
  active: bool,
};

let component = ReasonReact.reducerComponentWithRetainedProps("Tab");

let trigger = (callback: option(unit => unit)) : unit =>
  switch (callback) {
  | Some(f) => f()
  | None => ()
  };

let triggerArg = (callback: option('a => unit), arg: 'a) : unit =>
  switch (callback) {
  | Some(f) => f(arg)
  | None => ()
  };

let make =
    (
      ~editor: TextEditor.t,
      ~active: bool=false,
      ~open_: bool=false,
      ~onOpen: option(TextEditor.t => unit)=?,
      ~onKill: option(unit => unit)=?,
      ~onClose: option(unit => unit)=?,
      ~onDidChangeActive: option(bool => unit)=?,
      _children,
    ) => {
  ...component,
  initialState: () => {item: None, closedDeliberately: false},
  reducer: (action, state) =>
    switch (action, state.item) {
    | (Open, Some(_)) => NoUpdate
    | (UpdatePaneItem(_), Some(_)) => NoUpdate
    | (Activate, Some(oldItem)) =>
      SideEffects(
        (
          _self =>
            Environment.Workspace.paneForItem(oldItem)
            |> Pane.activateItem(oldItem)
            |> ignore
        ),
      )
    | (Kill, Some(oldItem)) =>
      ReasonReact.UpdateWithSideEffects(
        /* set the "closedDeliberately" to true to trigger "onKill" */
        {item: None, closedDeliberately: true},
        (
          _self =>
            Environment.Workspace.paneForItem(oldItem)
            |> Pane.destroyItem(oldItem)
            |> ignore
        ),
      )
    | (Open, None) =>
      SideEffects(
        (
          self => {
            let subscriptions = CompositeDisposable.make();
            /* mount the view onto the element */
            let itemDescriptor = createItemDescriptor(editor);
            Environment.Workspace.open_(itemDescriptor)
            |> then_(newItem => {
                 /* this pane */
                 let pane = Environment.Workspace.paneForItem(newItem);
                 /* update the state with the newly acquired item */
                 self.send(UpdatePaneItem(newItem));
                 /* trigger the "onOpen" callback */
                 triggerArg(onOpen, newItem);
                 /* onWillDestroyItem */
                 pane
                 |> Pane.onWillDestroyItem(event => {
                      /* if the item that's going to be destroyed happens to be this tab */
                      let destroyedTitle = Pane.getTitle(event##item);
                      let getTitle = itemDescriptor##getTitle;
                      if (destroyedTitle === getTitle()) {
                        /* invoke the onKill or onClose */
                        if (state.closedDeliberately) {
                          trigger(onKill);
                        } else {
                          trigger(onClose);
                        };
                        /* dispose */
                        CompositeDisposable.dispose(subscriptions);
                      };
                    })
                 |> CompositeDisposable.add(subscriptions);
                 /* onDidChangeActive */
                 pane
                 |> Pane.onDidChangeActiveItem(item => {
                      let activatedTitle = Pane.getTitle(item);
                      let getTitle = itemDescriptor##getTitle;
                      if (activatedTitle == getTitle()) {
                        triggerArg(onDidChangeActive, true);
                      } else {
                        triggerArg(onDidChangeActive, false);
                      };
                    })
                 |> CompositeDisposable.add(subscriptions);
                 /* return the previously active pane */
                 resolve(Environment.Workspace.getActivePane());
               })
            |> ignore;
          }
        ),
      )
    | (Activate, None) => NoUpdate
    | (UpdatePaneItem(item), None) => Update({...state, item: Some(item)})
    | (Kill, None) => NoUpdate
    },
  retainedProps: {
    open_,
    active,
  },
  didUpdate: ({oldSelf, newSelf}) => {
    /* open/close */
    switch (oldSelf.retainedProps.open_, newSelf.retainedProps.open_) {
    | (true, true) => ()
    | (true, false) => newSelf.send(Kill)
    | (false, true) => newSelf.send(Open)
    | (false, false) => ()
    };
    /* activation */
    switch (oldSelf.retainedProps.active, newSelf.retainedProps.active) {
    | (true, true) => ()
    | (true, false) => ()
    | (false, true) => newSelf.send(Activate)
    | (false, false) => ()
    };
  },
  render: _self => null,
};
