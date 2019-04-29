open ReasonReact;
/* open Rebase; */

open Type.View;

module Event = Event;

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
  header: Header.t,
  body: Body.t,
  maxHeight: int,
  mountAt,
  isActive: bool,
  shouldDisplay: bool,
  isPending: bool,
  settingsView: option(Tab.t),
  connection: option(Connection.t),
  connectionError: option(Connection.Error.t),
  mode,
};

let initialState = () => {
  {
    header: {
      text: "",
      style: PlainText,
    },
    body: Nothing,
    maxHeight: 170,
    mountAt: Bottom(createBottomPanel()),
    isActive: false,
    shouldDisplay: false,
    isPending: false,
    settingsView: None,
    connection: None,
    connectionError: None,
    mode: Display,
  };
};

type action =
  | Focus(Editors.sort)
  /* Query Editor related */
  | SetQueryRef(Atom.TextEditor.t)
  /* Settings Tab related */
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  /*  */
  | UpdateMountAt(mountAt)
  | MountTo(mountTo)
  | ToggleDocking
  | Activate
  | Deactivate
  | UpdateIsLoadedOrIsTyping(bool)
  | UpdateIsPending(bool)
  /*  */
  | UpdateConnection(option(Connection.t), option(Connection.Error.t))
  | UpdateHeader(Header.t)
  | UpdateBody(Body.t)
  | UpdateMode(mode)
  /*  */
  | MouseEvent(mouseEvent);

let mountPanel = (editors: Editors.t, mountTo, self) => {
  let createTab = () =>
    Tab.make(
      ~editor=editors.source,
      ~getTitle=
        () => "[Agda Mode] " ++ Atom.TextEditor.getTitle(editors.source),
      ~onClose=_ => self.send(MountTo(ToBottom)),
      ~onOpen=
        (_, _, previousItem) => {
          /* activate the previous pane (which opened this pane item) */
          let pane = Atom.Environment.Workspace.paneForItem(previousItem);
          pane |> Atom.Pane.activate;
          pane |> Atom.Pane.activateItem(previousItem);
        },
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
    }
  | Some(tab) =>
    if (open_) {
      /* <Settings> is opened */
      handles.onSettingsView |> Event.emitOk(true);
    } else {
      tab.kill();
      self.send(UpdateSettingsView(None));
      /* <Settings> is closed */
      handles.onSettingsView |> Event.emitOk(false);
    }
  };
};

let reducer = (editors: Editors.t, handles: View.handles, action, state) => {
  switch (action) {
  | Activate =>
    switch (state.mountAt) {
    | Bottom(_) => Update({...state, isActive: true})
    | Pane(tab) =>
      UpdateWithSideEffects({...state, isActive: true}, _ => tab.activate())
    }
  | Deactivate => Update({...state, isActive: false})
  | UpdateIsLoadedOrIsTyping(shouldDisplay) =>
    Update({...state, shouldDisplay})
  | UpdateIsPending(isPending) => Update({...state, isPending})
  | SetQueryRef(ref) =>
    SideEffects(_self => editors.query |> MiniEditor.Model.setRef(ref))
  | Focus(sort) => SideEffects(_self => editors |> Editors.Focus.on(sort))
  | MountTo(mountTo) => SideEffects(mountPanel(editors, mountTo))
  | ToggleDocking =>
    switch (state.mountAt) {
    | Bottom(_) => SideEffects(self => self.send(MountTo(ToPane)))
    | Pane(_) => SideEffects(self => self.send(MountTo(ToBottom)))
    }
  /* UpdateWithSideEffects() */
  | ToggleSettingsTab(open_) =>
    SideEffects(mountSettings(editors, handles, open_))
  | UpdateSettingsView(settingsView) => Update({...state, settingsView})
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
  | UpdateConnection(connection, connectionError) =>
    Update({...state, connection, connectionError})
  | UpdateHeader(header) => Update({...state, header})
  | UpdateBody(body) => Update({...state, body})
  | UpdateMode(mode) => Update({...state, mode})

  | MouseEvent(event) =>
    SideEffects(_ => handles.onMouseEvent |> Event.emitOk(event))
  };
};

let component = reducerComponent("View");

let make = (~editors: Editors.t, ~handles: View.handles, _children) => {
  ...component,
  initialState,
  reducer: reducer(editors, handles),
  didMount: self => {
    open Event;

    /* activate/deactivate <Panel> */
    handles.activatePanel
    |> onOk(activate => self.send(activate ? Activate : Deactivate))
    |> destroyWhen(self.onUnmount);

    /* display mode! */
    handles.display
    |> onOk(((header, body)) => {
         self.send(Activate);
         self.send(UpdateMode(Display));
         self.send(UpdateHeader(header));
         self.send(UpdateBody(body));
       })
    |> destroyWhen(self.onUnmount);

    /* inquire mode! */
    handles.inquire
    |> onOk(((header, placeholder, value)) => {
         self.send(Activate);
         self.send(UpdateMode(Inquire));
         self.send(Focus(Query));
         self.send(UpdateHeader(header));
         /* pass it on */
         handles.inquireQuery |> emitOk((placeholder, value));
       })
    |> destroyWhen(self.onUnmount);

    /* toggle docking */
    handles.toggleDocking
    |> onOk(() => self.send(ToggleDocking))
    |> destroyWhen(self.onUnmount);

    /* toggle pending spinner */
    handles.updateIsPending
    |> onOk(isPending => self.send(UpdateIsPending(isPending)))
    |> destroyWhen(self.onUnmount);

    /* toggle state of shouldDisplay */
    handles.updateShouldDisplay
    |> onOk(shouldDisplay =>
         self.send(UpdateIsLoadedOrIsTyping(shouldDisplay))
       )
    |> destroyWhen(self.onUnmount);

    handles.onInquireQuery
    |> on(_ => {
         self.send(UpdateMode(Display));
         self.send(Focus(Source));
       })
    |> destroyWhen(self.onUnmount);

    /* destroy everything */
    handles.destroy
    |> onOk(_ => Js.log("destroy!"))
    |> destroyWhen(self.onUnmount);

    /* opening/closing <Settings> */
    handles.activateSettingsView
    |> onOk(activate => self.send(ToggleSettingsTab(activate)))
    |> destroyWhen(self.onUnmount);

    handles.updateConnection
    |> onOk(((connection, error)) =>
         self.send(UpdateConnection(connection, error))
       )
    |> destroyWhen(self.onUnmount);
  },
  render: self => {
    let {
      header,
      body,
      mountAt,
      mode,
      isActive,
      shouldDisplay,
      isPending,
      settingsView,
      connection,
      connectionError,
    } =
      self.state;
    open View;
    let {
      interceptAndInsertKey,
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
      <MouseEmitter.Provider value={ev => self.send(MouseEvent(ev))}>
        <Panel.Jsx2
          editors
          element=panelElement
          header
          body
          mountAt
          hidden
          onMountAtChange={mountTo => self.send(MountTo(mountTo))}
          mode
          onInquireQuery={handles.onInquireQuery}
          isPending
          isActive
          /* editors */
          onEditorRef={ref => self.send(SetQueryRef(ref))}
          editorValue={editors.query.value}
          editorPlaceholder={editors.query.placeholder}
          interceptAndInsertKey
          activateInputMethod
          settingsView
          onSettingsViewToggle={status =>
            self.send(ToggleSettingsTab(status))
          }
        />
        <Settings.Jsx2
          inquireConnection
          onInquireConnection
          connection
          connectionError
          element=settingsElement
          navigate=navigateSettingsView
        />
      </MouseEmitter.Provider>
    </>;
  },
};

let initialize = editors => {
  open Webapi.Dom;
  let element = document |> Document.createElement("article");
  let handles = View.makeHandles();
  let view = View.make(handles);
  let component = ReasonReact.element(make(~editors, ~handles, [||]));
  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  view;
};
