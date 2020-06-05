open Belt;

module PanelContainer = {
  // get "article.agda-mode-panel-container", create one if not found
  external fromDomElement: Dom.element => Atom.Workspace.item = "%identity";
  external asElement:
    Webapi.Dom.HtmlElement.t_htmlElement => Webapi.Dom.Element.t =
    "%identity";
  open Webapi.Dom;

  let make = (): Element.t => {
    open DomTokenList;

    // create "article.agda-mode-panel-container"
    // shared by all instances, should only be invoked once!
    let createBottomPanelContainer = (): Element.t => {
      let panelContainer = document |> Document.createElement("article");
      panelContainer |> Element.classList |> add("agda-mode-panel-container");
      Atom.Workspace.addBottomPanel({
        "item": fromDomElement(panelContainer),
        "priority": 0,
        "visible": true,
      })
      |> ignore;
      panelContainer;
    };

    // see if the container has already been created
    let containers =
      Atom.Workspace.getBottomPanels()
      ->Array.map(Atom.Views.getView)
      ->Array.map(xs =>
          xs
          ->HtmlElement.childNodes
          ->NodeList.toArray
          ->Array.keepMap(HtmlElement.ofNode)
        )
      ->Array.concatMany
      ->Array.keep(elem =>
          HtmlElement.className(elem) == "agda-mode-panel-container"
        );

    switch (containers[0]) {
    | None => createBottomPanelContainer()
    | Some(container) => asElement(container)
    };
  };

  let add = (container, element) =>
    container |> Element.appendChild(element);
};

type t = {
  editor: Atom.TextEditor.t,
  element: Webapi.Dom.Element.t,
  subscriptions: array(unit => unit),
  onRequest: AgdaModeVscode.Event.t(AgdaModeVscode.View.Request.t),
  onResponse: AgdaModeVscode.Event.t(AgdaModeVscode.View.Response.t),
};

// messaging
let send = (view, request) => {
  view.onRequest.emit(request);
  view.onResponse.once();
};
let on = (view, callback) => {
  view.onResponse.on(
    fun
    | Event(event) => callback(event)
    | _ => (),
  )
  ->Js.Array.push(view.subscriptions)
  ->ignore;
  Atom.Disposable.make(_ => ());
};

// show/hide
let show = view => view->send(Show)->ignore;
let focus = _view => ();
let hide = view => view->send(Hide)->ignore;

let make = (_context, editor: Atom.TextEditor.t) => {
  let editorType = AgdaModeVscode.Sig.Atom;
  // event emitters for communicating with the view
  let onRequest = AgdaModeVscode.Event.make();
  let onResponse = AgdaModeVscode.Event.make();
  open Webapi.Dom;
  let container = PanelContainer.make();

  // add "agda-mode" to the class-list
  editor
  |> Atom.Views.getView
  |> HtmlElement.classList
  |> DomTokenList.add("agda-mode");

  // create a element to house the panel
  let element = document |> Document.createElement("article");
  element |> Element.setAttribute("tabIndex", "-1");
  element |> Element.classList |> DomTokenList.add("agda-mode-panel");
  element |> Element.classList |> DomTokenList.add("native-key-bindings");

  // add the element to the container
  PanelContainer.add(container, element);

  // render
  ReactDOMRe.render(<AgdaModeVscode.Panel onRequest onResponse />, element);

  let view = {editor, element, subscriptions: [||], onRequest, onResponse};

  // show the panel
  view->send(Show)->ignore;

  view;
};

let destroy = view => {
  // unmount the component
  ReactDOMRe.unmountComponentAtNode(view.element);
  Webapi.Dom.Element.remove(view.element);

  // remove "agda-mode" from the class-list of the editor
  view.editor
  |> Atom.Views.getView
  |> Webapi.Dom.HtmlElement.classList
  |> Webapi.Dom.DomTokenList.remove("agda-mode");

  view.subscriptions->Belt.Array.forEach(destructor => destructor());
};