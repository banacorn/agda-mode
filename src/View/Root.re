open ReactUpdate;

open Type.View;

module Event = Event;

external unsafeCast: (mouseEvent => unit) => string = "%identity";

/************************************************************************************************************/

/************************************************************************************************************/

let createBottomPanel = (): Webapi.Dom.Element.t => {
  open Webapi.Dom;
  open DomTokenListRe;
  let element = document |> Document.createElement("article");
  element |> Element.classList |> add("agda-mode");
  Atom.Environment.Workspace.addBottomPanel({
    "item": element,
    "visible": true,
  })
  |> ignore;
  element;
};

type state = {
  mountAt,
  isActive: bool,
  settingsView: option(Tab.t),
};

let initialState = {
  mountAt: Bottom(createBottomPanel()),
  isActive: false,
  settingsView: None,
};

type action =
  /* Settings Tab related */
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  /*  */
  | UpdateMountAt(mountAt)
  | MountTo(mountTo)
  | ToggleDocking
  | Activate
  | Deactivate;
/*  */

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
          Atom.Environment.Workspace.paneForItem(previousItem)
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
    self.send(UpdateMountAt(Bottom(createBottomPanel())));
  | (Pane(_), ToPane) => ()
  };
  None;
};

let mountSettings = (editors: Editors.t, handles, open_, self) => {
  switch (self.state.settingsView) {
  | None =>
    if (open_) {
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
              self.send(ToggleSettingsTab(false));
              /* <Settings> is closed */
              handles.onSettingsView |> Event.emitOk(false);
            },
          (),
        );
      self.send(UpdateSettingsView(Some(tab)));
    };
    None;
  | Some(tab) =>
    if (open_) {
      /* <Settings> is opened */
      handles.onSettingsView |> Event.emitOk(true);
    } else {
      tab.kill();
      self.send(UpdateSettingsView(None));
      /* <Settings> is closed */
      handles.onSettingsView |> Event.emitOk(false);
    };
    None;
  };
};

let reducer = (editors: Editors.t, handles: View.handles, action, state) => {
  switch (action) {
  | Activate =>
    switch (state.mountAt) {
    | Bottom(_) => Update({...state, isActive: true})
    | Pane(tab) =>
      UpdateWithSideEffects(
        {...state, isActive: true},
        _ => {
          tab.activate();
          None;
        },
      )
    }
  | Deactivate => Update({...state, isActive: false})
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
  | ToggleSettingsTab(open_) =>
    SideEffects(mountSettings(editors, handles, open_))
  | UpdateSettingsView(settingsView) => Update({...state, settingsView})
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
  };
};

module MouseEventProvider = {
  [@bs.obj]
  external makeProps:
    (~value: Type.View.mouseEvent => unit, ~children: React.element, unit) =>
    {
      .
      "children": React.element,
      "value": Type.View.mouseEvent => unit,
    } =
    "";

  let make = React.Context.provider(mouseEmitter);
};

[@react.component]
let make = (~editors: Editors.t, ~handles: View.handles) => {
  let (state, send) =
    ReactUpdate.useReducer(initialState, reducer(editors, handles));
  let queryRef = React.useRef(None);

  let (header, setHeader) =
    Hook.useState({Header.text: "", style: PlainText});
  let (body, setBody) = Hook.useState(Body.Nothing);
  let (mode, setMode) = Hook.useState(Display);
  let (shouldDisplay, setShouldDisplay) = Hook.useState(false);
  let (isPending, setIsPending) = Hook.useState(false);
  let ((connection, connectionError), setConnectionAndError) =
    Hook.useState((None, None));

  React.useEffect1(
    () => {
      editors.query = React.Ref.current(queryRef);
      None;
    },
    [||],
  );

  /* activate/deactivate <Panel> */
  Hook.useEventListener(
    activate => send(activate ? Activate : Deactivate),
    handles.activatePanel,
  );

  /* display mode! */
  Hook.useEventListener(
    ((header, body)) => {
      setMode(Display);
      setHeader(header);
      setBody(body);
    },
    handles.display,
  );
  /* inquire mode! */
  Hook.useEventListener(
    ((header, placeholder, value)) => {
      send(Activate);
      setMode(Inquire);
      editors |> Editors.Focus.on(Query);
      setHeader(header);
      /* pass it on */
      handles.inquireQuery |> Event.emitOk((placeholder, value));
    },
    handles.inquire,
  );
  /* toggle docking */
  Hook.useEventListener(() => send(ToggleDocking), handles.toggleDocking);
  /* toggle pending spinner */
  Hook.useEventListener(setIsPending, handles.updateIsPending);
  /* toggle state of shouldDisplay */
  Hook.useEventListener(setShouldDisplay, handles.updateShouldDisplay);
  Hook.useEventListener(
    _ => {
      setMode(Display);
      editors |> Editors.Focus.on(Source);
    },
    handles.onInquireQuery,
  );
  /* destroy everything */
  Hook.useEventListener(_ => Js.log("destroy!"), handles.destroy);

  /* opening/closing <Settings> */
  Hook.useEventListener(
    activate => send(ToggleSettingsTab(activate)),
    handles.activateSettingsView,
  );
  Hook.useEventListener(setConnectionAndError, handles.updateConnection);

  let {mountAt, isActive, settingsView} = state;

  let {
    View.interceptAndInsertKey,
    activateInputMethod,
    inquireConnection,
    onInquireConnection,
    navigateSettingsView,
  } = handles;
  let panelElement: Webapi.Dom.Element.t =
    switch (mountAt) {
    | Bottom(element) => element
    | Pane(tab) => tab.element
    };
  let settingsElement: option(Webapi.Dom.Element.t) =
    switch (settingsView) {
    | None => None
    | Some(tab) => Some(tab.element)
    };
  let hidden =
    switch (mountAt) {
    // only show the view when it's loaded and active
    | Bottom(_) => !(isActive && shouldDisplay)
    | Pane(_) => false
    };

  <>
    <MouseEventProvider
      value={event => handles.onMouseEvent |> Event.emitOk(event)}>
      <Panel
        editors
        element=panelElement
        header
        body
        mountAt
        hidden
        onMountAtChange={mountTo => send(MountTo(mountTo))}
        mode
        onInquireQuery={handles.onInquireQuery}
        isPending
        isActive
        /* editors */
        onEditorRef={ref => React.Ref.setCurrent(queryRef, Some(ref))}
        editorValue=""
        // {editors.query.value}
        // {editors.query.placeholder}
        editorPlaceholder=""
        interceptAndInsertKey
        activateInputMethod
        settingsView
        onSettingsViewToggle={status => send(ToggleSettingsTab(status))}
      />
      <Settings
        inquireConnection
        onInquireConnection
        connection
        connectionError
        element=settingsElement
        navigate=navigateSettingsView
      />
    </MouseEventProvider>
  </>;
};

let initialize = editors => {
  open Webapi.Dom;
  let element = document |> Document.createElement("article");
  let handles = View.makeHandles();
  let view = View.make(handles);

  let component =
    React.createElementVariadic(
      make,
      makeProps(~editors, ~handles, ()),
      [||],
    );

  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  view;
};
