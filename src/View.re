open ReasonReact;
/* open Rebase; */

open Type.View;

module Event = Event;

/************************************************************************************************************/

module Handles = {
  type t = {
    display: Event.t((Header.t, Body.t), unit),
    inquire: Event.t((Header.t, string, string), unit),
    toggleDocking: Event.t(unit, unit),
    activatePanel: Event.t(bool, unit),
    updateIsPending: Event.t(bool, unit),
    updateConnection:
      Event.t((option(Connection.t), option(Connection.Error.t)), unit),
    inquireConnection: Event.t(unit, unit),
    onInquireConnection: Event.t(string, MiniEditor.error),
    inquireQuery: Event.t((string, string), unit),
    onInquireQuery: Event.t(string, MiniEditor.error),
    activateSettingsView: Event.t(bool, unit),
    onSettingsView: Event.t(bool, unit),
    navigateSettingsView: Event.t(Settings.uri, unit),
    destroy: Event.t(unit, unit),
    /* Input Method */
    activateInputMethod: Event.t(bool, unit),
    interceptAndInsertKey: Event.t(string, unit),
    /* Mouse Events */
    onMouseEvent: Event.t(mouseEvent, unit),
  };

  let hook = (f, handle) => f := handle;

  /* creates all refs and return them */
  let make = () => {
    /* public */
    let activatePanel = Event.make();
    let display = Event.make();
    let inquire = Event.make();
    let toggleDocking = Event.make();

    let updateIsPending = Event.make();

    /* private */

    /* connection-related */
    let updateConnection = Event.make();
    let inquireConnection = Event.make();
    let onInquireConnection = Event.make();

    /* query-related */
    let onInquireQuery = Event.make();
    let inquireQuery = Event.make();

    /* <Settings> related */
    let activateSettingsView = Event.make();
    let onSettingsView = Event.make();
    let navigateSettingsView = Event.make();

    /* <InputMethod> related */
    let interceptAndInsertKey = Event.make();
    let activateInputMethod = Event.make();

    let onMouseEvent = Event.make();

    let destroy = Event.make();
    {
      display,
      inquire,
      activatePanel,
      toggleDocking,
      updateIsPending,
      updateConnection,
      inquireConnection,
      onInquireConnection,
      onInquireQuery,
      inquireQuery,
      activateSettingsView,
      onSettingsView,
      navigateSettingsView,
      destroy,
      activateInputMethod,
      interceptAndInsertKey,
      onMouseEvent,
    };
  };

  open Type.View.Header;
  open Async;
  let activate = handles => {
    handles.activatePanel |> Event.emitOk(true);
  };
  let deactivate = handles => {
    handles.activatePanel |> Event.emitOk(false);
  };
  let destroy = handles => {
    deactivate(handles);
    handles.destroy |> Event.emitOk();
  };

  let display = (text, style, body, handles) => {
    handles.display |> Event.emitOk(({text, style}, body));
    Async.resolve();
  };

  let inquire =
      (text, placeholder, value, handles): Async.t(string, MiniEditor.error) => {
    let promise = handles.onInquireQuery |> Event.once;
    handles.inquire
    |> Event.emitOk(({text, style: PlainText}, placeholder, value));
    promise;
  };

  let toggleDocking = (handles): Async.t(unit, unit) => {
    handles.toggleDocking |> Event.emitOk();
    Async.resolve();
  };

  let updateIsPending = (isPending, handles): Async.t(unit, unit) => {
    handles.updateIsPending |> Event.emitOk(isPending);
    Async.resolve();
  };
  let onOpenSettingsView = (handles): Async.t(bool, MiniEditor.error) => {
    handles.onSettingsView |> Event.once |> mapError(_ => MiniEditor.Cancelled);
  };
  let navigateSettingsView = (where, handles) => {
    handles.navigateSettingsView |> Event.emitOk(where);
  };
  let onInquireConnection = handles => {
    handles.onInquireConnection |> Event.once;
  };
  let inquireConnection = handles => {
    handles.inquireConnection |> Event.emitOk();
  };
  let updateConnection = (connection, error, handles) => {
    handles.updateConnection |> Event.emitOk((connection, error));
  };
  let activateSettingsView = handles => {
    handles.activateSettingsView |> Event.emitOk(true);
  };
};

/************************************************************************************************************/

let createElement = (): Webapi.Dom.Element.t => {
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
  activated: bool,
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
    mountAt: Bottom(createElement()),
    activated: false,
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
    self.send(UpdateMountAt(Bottom(createElement())));
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
              handles.Handles.onSettingsView |> Event.emitOk(true),
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

let reducer = (editors: Editors.t, handles: Handles.t, action, state) => {
  switch (action) {
  | Activate =>
    switch (state.mountAt) {
    | Bottom(_) => Update({...state, activated: true})
    | Pane(tab) =>
      UpdateWithSideEffects({...state, activated: true}, _ => tab.activate())
    }
  | Deactivate => Update({...state, activated: false})
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

let make = (~editors: Editors.t, ~handles: Handles.t, _children) => {
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
      activated,
      isPending,
      settingsView,
      connection,
      connectionError,
    } =
      self.state;
    open Handles;
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
      | Bottom(_) => !activated
      | Pane(_) => false
      };
    <>
      <MouseEmitter.Provider value={ev => self.send(MouseEvent(ev))}>
        <Panel
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
        <Settings
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
  let handles = Handles.make();
  let component = ReasonReact.element(make(~editors, ~handles, [||]));
  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  handles;
};
