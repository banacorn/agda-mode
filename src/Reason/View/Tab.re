open ReasonReact;

open Webapi.Dom;

open Js.Promise;

open Rebase;

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

type handle = {
  element: Element.t,
  kill: unit => unit,
  activate: unit => unit,
};

let make =
    (
      ~editor: TextEditor.t,
      ~onOpen: option((Element.t, TextEditor.t) => unit)=?,
      ~onKill: option(unit => unit)=?,
      ~onClose: option(unit => unit)=?,
      ~onDidChangeActive: option(bool => unit)=?,
      (),
    )
    : handle => {
  let itemResource = Util.Resource.make();
  let closedDeliberately = ref(false);
  let subscriptions = CompositeDisposable.make();
  /* mount the view onto the element */
  let itemDescriptor = createItemDescriptor(editor);
  Environment.Workspace.open_(itemDescriptor)
  |> then_(newItem => {
       itemResource.supply(newItem);
       /* this pane */
       let pane = Environment.Workspace.paneForItem(newItem);
       /* trigger the "onOpen" callback */
       switch (onOpen) {
       | Some(callback) => callback(itemDescriptor##element, newItem)
       | None => ()
       };
       /* onWillDestroyItem */
       pane
       |> Pane.onWillDestroyItem(event => {
            /* if the item that's going to be destroyed happens to be this tab */
            let destroyedTitle = Pane.getTitle(event##item);
            let getTitle = itemDescriptor##getTitle;
            if (destroyedTitle === getTitle()) {
              /* invoke the onKill or onClose */
              if (closedDeliberately^) {
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
  {
    element: itemDescriptor##element,
    kill: () =>
      itemResource.acquire()
      |> Js.Promise.then_(item => {
           /* set the "closedDeliberately" to true to trigger "onKill" */
           closedDeliberately := true;
           Environment.Workspace.paneForItem(item)
           |> Pane.destroyItem(item)
           |> Js.Promise.resolve;
         })
      |> ignore,
    activate: () =>
      itemResource.acquire()
      |> Js.Promise.then_(item =>
           Environment.Workspace.paneForItem(item)
           |> Pane.activateItem(item)
           |> Js.Promise.resolve
         )
      |> ignore,
  };
};
