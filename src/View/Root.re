open Rebase;
open Rebase.Fn;

open Type.View;

module Event = Event;

external unsafeCast: (Mouse.event => unit) => string = "%identity";

external asElement:
  Webapi.Dom.HtmlElement.t_htmlElement => Webapi.Dom.Element.t =
  "%identity";
/************************************************************************************************************/

/************************************************************************************************************/

external fromDomElement: Dom.element => Atom.Workspace.item = "%identity";

// get "article.agda-mode-panel-container", create one if not found
let getBottomPanelContainer = (): Webapi.Dom.Element.t => {
  open Webapi.Dom;
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

  let containers =
    Atom.Workspace.getBottomPanels()
    |> Array.map(Atom.Views.getView)
    |> Array.flatMap(
         HtmlElement.childNodes
         >> NodeList.toArray
         >> Array.filterMap(HtmlElement.ofNode),
       )
    |> Array.filter(elem =>
         elem |> HtmlElement.className == "agda-mode-panel-container"
       );

  switch (containers[0]) {
  | None => createBottomPanelContainer()
  | Some(container) => asElement(container)
  };
};

let getPanelContainerFromMountingPoint =
  fun
  | Bottom(element) => element
  | Pane(tab) => tab |> Tab.getElement;

[@react.component]
let make =
    (~editors: Editors.t, ~handles: View.handles, ~channels: Channels.t) => {
  ////////////////////////////////////////////
  // <Settings>
  ////////////////////////////////////////////

  let (settingsActivated, setSettingsActivation) = Hook.useState(false);
  let (settingsView, setSettingsView) = Hook.useState(None);
  let settingsElement = settingsView |> Option.map(Tab.getElement);
  let ((connection, connectionError), setConnectionAndError) =
    Hook.useState((None, None));

  // input
  Hook.useEventListener(setSettingsActivation, handles.activateSettingsView);
  Hook.useEventListener(setConnectionAndError, handles.updateConnection);

  React.useEffect1(
    () =>
      switch (settingsView, settingsActivated) {
      | (None, true) =>
        let tab =
          Tab.make(
            ~editor=editors.source,
            ~getTitle=
              () => "[Settings] " ++ Atom.TextEditor.getTitle(editors.source),
            ~path="settings",
            ~onOpen=
              (_, _, _) =>
                /* <Settings> is opened */
                handles.View.onSettingsView |> Event.emitOk(true),
            ~onClose=
              _ => {
                setSettingsActivation(false);
                /* <Settings> is closed */
                handles.onSettingsView |> Event.emitOk(false);
              },
            (),
          );
        setSettingsView(Some(tab));
        None;
      | (None, false) => None
      | (Some(_), true) =>
        /* <Settings> is opened */
        handles.onSettingsView |> Event.emitOk(true);
        None;
      | (Some(tab), false) =>
        Tab.kill(tab);
        setSettingsView(None);

        /* <Settings> is closed */
        handles.onSettingsView |> Event.emitOk(false);
        None;
      },
    [|settingsActivated|],
  );

  ////////////////////////////////////////////
  // mounting point
  ////////////////////////////////////////////

  let (mountingPoint, setMountingPoint) =
    Hook.useState(Bottom(getBottomPanelContainer()));

  // let (state, send) =
  //   ReactUpdate.useReducer(initialState, reducer(editors));
  // in case that we need to access the latest mounting point from Hook.useChannel
  // as the closure of the callback of Hook.useChannel is only captured at the first render
  let mountingPointRef = React.useRef(mountingPoint);
  React.Ref.setCurrent(mountingPointRef, mountingPoint);

  // reset the element of editors.query everytime <Panel> got remounted
  // issue #104: https://github.com/banacorn/agda-mode/issues/104
  let queryRef = React.useRef(None);
  React.useEffect1(
    () => {
      editors.query = React.Ref.current(queryRef);
      None;
    },
    [|mountingPoint|],
  );

  let rec mountPanel = (editors: Editors.t, mountingTarget) => {
    let createTab = () =>
      Tab.make(
        ~editor=editors.source,
        ~getTitle=
          () => "[Agda Mode] " ++ Atom.TextEditor.getTitle(editors.source),
        ~path="panel",
        ~onClose=_ => mountAtBottom(),
        ~onOpen=
          (_, _, previousItem) =>
            /* activate the previous pane (which opened this pane item) */
            Atom.Workspace.paneForItem(previousItem)
            |> Rebase.Option.forEach(pane => {
                 pane |> Atom.Pane.activate;
                 pane |> Atom.Pane.activateItem(previousItem);
               }),
        (),
      );
    switch (React.Ref.current(mountingPointRef), mountingTarget) {
    | (Bottom(_), AtBottom) => ()
    | (Bottom(_), AtPane) => setMountingPoint(Pane(createTab()))
    | (Pane(tab), AtBottom) =>
      Tab.kill(tab);
      setMountingPoint(Bottom(getBottomPanelContainer()));
    | (Pane(_), AtPane) => ()
    };
  }
  and mountAtPane = () => mountPanel(editors, AtPane)
  and mountAtBottom = () => mountPanel(editors, AtBottom);
  /* toggle docking */
  Hook.useChannel(
    () => {
      switch (React.Ref.current(mountingPointRef)) {
      | Bottom(_) => mountAtPane()
      | Pane(_) => mountAtBottom()
      };
      Async.resolve();
    },
    channels.toggleDocking,
  );

  ////////////////////////////////////////////
  // <Panel> Activation/Deactivation
  ////////////////////////////////////////////

  let (activated, setActivation) = Hook.useState(false);

  // side-effects
  React.useEffect1(
    () => {
      if (activated) {
        switch (mountingPoint) {
        | Bottom(_) => ()
        | Pane(tab) => Tab.activate(tab)
        };
      };
      None;
    },
    [|activated|],
  );

  // input
  Hook.useChannel(
    () => {
      setActivation(true);
      mountingPointRef
      |> React.Ref.current
      |> getPanelContainerFromMountingPoint
      |> Async.resolve;
    },
    channels.activatePanel,
  );

  Hook.useChannel(
    () => {
      setActivation(false);
      Async.resolve();
    },
    channels.deactivatePanel,
  );

  let (debug, debugDispatch) =
    React.useReducer(Debug.reducer, Debug.initialState);

  let (header, setHeader) =
    Hook.useState({Header.text: "", style: PlainText});
  let (body, setBody) = Hook.useState(Body.Nothing);
  let (mode, setMode) = Hook.useState(Display);

  /* display mode! */
  Hook.useChannel(
    ((header, body)) => {
      setMode(Display);
      setHeader(header);
      setBody(body);
      Async.resolve();
    },
    channels.display,
  );

  Hook.useChannel(
    ((header, _placeholder, _value)) => {
      setMode(Inquire);
      editors |> Editors.Focus.on(Query);
      setHeader(header);

      // after inquiring
      handles.onInquire
      |> Event.once
      |> Async.pass(_ => {
           setMode(Display);
           editors |> Editors.Focus.on(Source);
         });
    },
    channels.inquire,
  );

  // destroy everything
  let panelRef = React.useRef(Js.Nullable.null);
  Hook.useChannel(
    () => {
      open Webapi.Dom;

      // `stateRef` is permanant
      let mountingPoint = React.Ref.current(mountingPointRef);
      switch (mountingPoint) {
      | Bottom(container) =>
        // removes `.agda-mode-panel` from the `.agda-mode-panel-container`
        let panel = React.Ref.current(panelRef) |> Js.Nullable.toOption;
        switch (panel) {
        | None => ()
        | Some(elem) => container |> Element.removeChild(elem) |> ignore
        };
      | Pane(tab) => Tab.kill(tab)
      };

      Async.resolve();
    },
    handles.destroy,
  );

  let {
    View.inquireConnection,
    onInquireConnection,
    onInputMethodChange,
    navigateSettingsView,
  } = handles;
  let containerElement = getPanelContainerFromMountingPoint(mountingPoint);

  let hidden =
    switch (mountingPoint) {
    // only show the view when it's loaded and active
    | Bottom(_) => !activated
    | Pane(_) => false
    };

  <>
    <Channels.Provider value=channels>
      <Mouse.Provider
        value={event => handles.onMouseEvent |> Event.emitOk(event)}>
        <Debug.Provider value=debugDispatch>
          <Panel
            panelRef
            editors
            containerElement
            header
            body
            mountingPoint
            hidden
            onMountingTargetChange={
              fun
              | AtBottom => mountAtBottom()
              | AtPane => mountAtPane()
            }
            mode
            activated
            /* editors */
            onQueryEditorRef={ref =>
              React.Ref.setCurrent(queryRef, Some(ref))
            }
            onInquireQuery={handles.onInquire}
            editorValue=""
            // {editors.query.value}
            // {editors.query.placeholder}
            editorPlaceholder=""
            onInputMethodChange
            settingsActivated
            onSettingsViewToggle=setSettingsActivation
          />
          <Settings
            inquireConnection
            onInquireConnection
            connection
            connectionError
            debug
            element=settingsElement
            navigate=navigateSettingsView
          />
        </Debug.Provider>
      </Mouse.Provider>
    </Channels.Provider>
  </>;
};

let initialize = editors => {
  open Webapi.Dom;
  let element = document |> Document.createElement("article");
  let handles = View.makeHandles();
  let channels = Channels.make();
  let view = View.make(handles, channels);

  let component =
    React.createElementVariadic(
      make,
      makeProps(~editors, ~handles, ~channels, ()),
      [||],
    );

  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  view;
};
