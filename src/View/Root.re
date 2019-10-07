open Rebase;
open Rebase.Fn;

open ReactUpdate;

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

type state = {
  mountAt,
  settingsView: option(Tab.t),
};

let getPanelContainerFromState = state =>
  switch (state.mountAt) {
  | Bottom(element) => element
  | Pane(tab) => tab.element
  };

let initialState = {
  mountAt: Bottom(getBottomPanelContainer()),
  settingsView: None,
};

type action =
  | UpdateMountAt(mountAt)
  | MountTo(mountTo)
  | ToggleDocking;

let mountPanel = (editors: Editors.t, mountTo, self) => {
  let createTab = () =>
    Tab.make(
      ~editor=editors.source,
      ~getTitle=
        () => "[Agda Mode] " ++ Atom.TextEditor.getTitle(editors.source),
      ~path="panel",
      ~onClose=_ => self.send(MountTo(ToBottom)),
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
  switch (self.state.mountAt, mountTo) {
  | (Bottom(_), ToBottom) => ()
  | (Bottom(_), ToPane) => self.send(UpdateMountAt(Pane(createTab())))
  | (Pane(tab), ToBottom) =>
    tab.kill();
    self.send(UpdateMountAt(Bottom(getBottomPanelContainer())));
  | (Pane(_), ToPane) => ()
  };
  None;
};

let reducer = (editors: Editors.t, action, state) => {
  switch (action) {
  | MountTo(mountTo) => SideEffects(mountPanel(editors, mountTo))
  | ToggleDocking =>
    switch (state.mountAt) {
    | Bottom(_) =>
      SideEffects(
        ({send}) => {
          send(MountTo(ToPane));
          None;
        },
      )
    | Pane(_) =>
      SideEffects(
        ({send}) => {
          send(MountTo(ToBottom));
          None;
        },
      )
    }
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
  };
};

[@react.component]
let make =
    (~editors: Editors.t, ~handles: View.handles, ~channels: Channels.t) => {
  ////////////////////////////////////////////
  // <Settings>
  ////////////////////////////////////////////

  let (settingsActivated, setSettingsActivation) = Hook.useState(false);
  let (settingsView, setSettingsView) = Hook.useState(None);
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
        tab.Tab.kill();
        setSettingsView(None);

        /* <Settings> is closed */
        handles.onSettingsView |> Event.emitOk(false);
        None;
      },
    [|settingsActivated|],
  );
  ////////////////////////////////////////////
  // <Panel>
  ////////////////////////////////////////////

  let (state, send) =
    ReactUpdate.useReducer(initialState, reducer(editors));
  // in case that we need to access the latest state from Hook.useChannel
  // as the closure of the callback of Hook.useChannel is only captured at the first render
  let stateRef = React.useRef(state);
  React.Ref.setCurrent(stateRef, state);

  // <Panel> Activation
  let (activated, setActivation) = Hook.useState(false);

  // output: activated
  React.useEffect1(
    () => {
      if (activated) {
        switch (state.mountAt) {
        | Bottom(_) => ()
        | Pane(tab) => tab.activate()
        };
      };
      None;
    },
    [|activated|],
  );

  // input: activated
  Hook.useChannel(
    () => {
      setActivation(true);
      stateRef
      |> React.Ref.current
      |> getPanelContainerFromState
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

  let queryRef = React.useRef(None);

  let (debug, debugDispatch) =
    React.useReducer(Debug.reducer, Debug.initialState);

  let (header, setHeader) =
    Hook.useState({Header.text: "", style: PlainText});
  let (body, setBody) = Hook.useState(Body.Nothing);
  let (mode, setMode) = Hook.useState(Display);

  let panelRef = React.useRef(Js.Nullable.null);

  // reset the element of editors.query  everytime <Panel> got remounted
  // issue #104: https://github.com/banacorn/agda-mode/issues/104
  React.useEffect1(
    () => {
      editors.query = React.Ref.current(queryRef);
      None;
    },
    [|state.mountAt|],
  );

  /* toggle docking */
  Hook.useChannel(
    () => {
      send(ToggleDocking);
      Async.resolve();
    },
    channels.toggleDocking,
  );

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
      setActivation(true);
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
  Hook.useChannel(
    () => {
      open Webapi.Dom;
      // removes `.agda-mode-panel` from the `.agda-mode-panel-container`

      // `stateRef` is permanant
      let state = React.Ref.current(stateRef);
      switch (state.mountAt) {
      | Bottom(container) =>
        let panel = React.Ref.current(panelRef) |> Js.Nullable.toOption;

        switch (panel) {
        | None => ()
        | Some(elem) => container |> Element.removeChild(elem) |> ignore
        };
      | Pane(tab) => tab.kill()
      };

      Async.resolve();
    },
    handles.destroy,
  );

  let {mountAt, settingsView} = state;

  let {
    View.inquireConnection,
    onInquireConnection,
    onInputMethodChange,
    navigateSettingsView,
  } = handles;
  let containerElement = getPanelContainerFromState(state);

  let settingsElement: option(Webapi.Dom.Element.t) =
    switch (settingsView) {
    | None => None
    | Some(tab) => Some(tab.element)
    };
  let hidden =
    switch (mountAt) {
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
            mountAt
            hidden
            onMountAtChange={mountTo => send(MountTo(mountTo))}
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
            settingsView
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
