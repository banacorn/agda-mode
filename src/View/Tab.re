open Webapi.Dom;

open Js.Promise;
open Rebase;

open Atom;

let createPanelContainer = () => {
  open DomTokenList;
  let element = document |> Document.createElement("article");
  element |> Element.classList |> add("agda-mode-panel-container");
  element;
};

let itemOptions = {
  "initialLine": 0,
  "initialColumn": 0,
  "split": "right",
  "activatePane": true,
  "activateItem": true,
  "pending": false,
  "searchAllPanes": true,
  "location": (None: option(string)),
};

let trigger = (callback: option(unit => unit)): unit =>
  switch (callback) {
  | Some(f) => f()
  | None => ()
  };

let triggerArg = (callback: option('a => unit), arg: 'a): unit =>
  switch (callback) {
  | Some(f) => f(arg)
  | None => ()
  };

type t = {
  itemResource: Resource.t(Workspace.item),
  subscriptions: CompositeDisposable.t,
  closedDeliberately: ref(bool),
  itemOpener: {
    .
    "element": Dom.element,
    "getTitle": unit => string,
  },
  // element: Element.t,
  // kill: unit => unit,
  // activate: unit => unit,
};

external asWorkspaceItem: Atom.TextEditor.t => Atom.Workspace.item =
  "%identity";

let make =
    (
      ~editor: TextEditor.t,
      ~getTitle: unit => string,
      ~path: string,
      ~onOpen: option((Element.t, Workspace.item, Workspace.item) => unit)=?,
      ~onKill: option(Element.t => unit)=?,
      ~onClose: option(Element.t => unit)=?,
      ~onDidChangeActive: option(bool => unit)=?,
      (),
    ) => {
  let itemResource: Resource.t(Workspace.item) = Resource.make();
  let closedDeliberately = ref(false);
  let subscriptions = CompositeDisposable.make();
  let previousItem = Workspace.getActivePane() |> Pane.getActiveItem;
  /* mount the view onto the element */
  let itemURI =
    "agda-mode://"
    ++ Option.getOr("untitled", TextEditor.getPath(editor))
    ++ "/"
    ++ path;
  let itemOpener = {"element": createPanelContainer(), "getTitle": getTitle};
  /* add tab opener */
  Workspace.addOpener(givenURI =>
    givenURI == itemURI ? Some(itemOpener) : None
  )
  |> CompositeDisposable.add(subscriptions);
  /* open the registered tab opener */
  Workspace.open_(itemURI, itemOptions)
  |> then_(newEditor => {
       let newItem = asWorkspaceItem(newEditor);
       itemResource.supply(newItem);
       /* trigger the "onOpen" callback */
       switch (onOpen) {
       | Some(callback) =>
         callback(itemOpener##element, newItem, previousItem)
       | None => ()
       };
       /* this pane onWillDestroyItem */
       let pane = Workspace.paneForItem(newItem);
       pane
       |> Option.forEach(pane' =>
            pane'
            |> Pane.onWillDestroyItem(event => {
                 /* if the item that's going to be destroyed happens to be this tab */
                 let destroyedTitle = event##item##getTitle();
                 let getTitle = itemOpener##getTitle;
                 if (destroyedTitle === getTitle()) {
                   /* invoke the onKill or onClose */
                   if (closedDeliberately^) {
                     triggerArg(onKill, itemOpener##element);
                   } else {
                     triggerArg(onClose, itemOpener##element);
                   };
                   /* dispose subscriptions */
                   CompositeDisposable.dispose(subscriptions);
                 };
               })
            |> CompositeDisposable.add(subscriptions)
          );
       /* onDidChangeActive */
       pane
       |> Option.forEach(pane' =>
            pane'
            |> Pane.onDidChangeActiveItem(item => {
                 let activatedTitle = item##getTitle();
                 let getTitle = itemOpener##getTitle;
                 if (activatedTitle == getTitle()) {
                   triggerArg(onDidChangeActive, true);
                 } else {
                   triggerArg(onDidChangeActive, false);
                 };
               })
            |> CompositeDisposable.add(subscriptions)
          );
       /* return the previously active pane */
       resolve(Workspace.getActivePane());
     })
  |> ignore;
  {itemResource, subscriptions, closedDeliberately, itemOpener};
};

let kill = self =>
  self.itemResource.acquire()
  ->Promise.get((item: Workspace.item) => {
      /* dispose subscriptions */
      CompositeDisposable.dispose(self.subscriptions);
      /* set the "closedDeliberately" to true to trigger "onKill" */
      self.closedDeliberately := true;
      Workspace.paneForItem(item)
      |> Option.forEach(pane => Pane.destroyItem(item, pane) |> ignore);
    }) /* }*/;

let getElement = self => self.itemOpener##element;

let activate = self =>
  self.itemResource.acquire()
  ->Promise.get((item: Workspace.item) =>
      Workspace.paneForItem(item)
      |> Option.forEach(pane => Pane.activateItem(item, pane) |> ignore)
    );
