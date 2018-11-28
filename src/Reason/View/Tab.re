open ReasonReact;

open Webapi.Dom;

open Js.Promise;

open Atom;

type item = {
  .
  "element": ElementRe.t,
  "getURI": unit => string,
  "getTitle": unit => string,
  "getDefaultLocation": unit => string,
};

let createItem = (editor: TextEditor.t) : item => {
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

type method = {
  open_: unit => unit,
  kill: unit => unit,
  activate: unit => unit,
};

type action =
  | Open
  | Activate
  | UpdatePaneItem(TextEditor.t)
  | Kill;

/* let setRef = (r, {ReasonReact.state}) =>
   state.ref :=
     Js.Nullable.toOption(r)
     |> Option.map(r => ReasonReact.refToJsObj(r)##getModel()); */
let component = ReasonReact.reducerComponent("Tab");

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
      ~handle: option(method => unit)=?,
      ~editor: TextEditor.t,
      ~onOpen: option(TextEditor.t => unit)=?,
      ~onKill: option(unit => unit)=?,
      ~onClose: option(unit => unit)=?,
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
            let item = createItem(editor);
            Environment.Workspace.open_(item)
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
                      let getTitle = item##getTitle;
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
  didMount: self => {
    let open_ = () => self.send(Open);
    let kill = () => self.send(Kill);
    let activate = () => self.send(Activate);
    triggerArg(handle, {open_, kill, activate});
  },
  render: _self => null,
};
