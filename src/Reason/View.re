open ReasonReact;
/* open Rebase; */

open Type.View;

module Event = Event;

/************************************************************************************************************/

module Handles = {
  type t = {
    display: Event.t((Header.t, body), unit),
    inquire: Event.t((Header.t, string, string), unit),
    toggleDocking: Event.t(unit, unit),
    activatePanel: Event.t(bool, unit),
    updateConnection: Event.t(option(Connection.t), unit),
    inquireConnection: Event.t((option(Connection.error), string), unit),
    onInquireConnection: Event.t(string, MiniEditor.error),
    onInquireQuery: Event.t(string, MiniEditor.error),
    inquireQuery: Event.t((string, string), unit),
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
  body,
  maxHeight: int,
  mountAt,
  activated: bool,
  settingsView: option(Tab.t),
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
    settingsView: None,
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
  /*  */
  | UpdateHeader(Header.t)
  | UpdateBody(body)
  | UpdateMode(mode)
  /*  */
  | MouseEvent(mouseEvent);

let mountPanel = (editors: Editors.t, self, mountTo) => {
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

let reducer = (editors: Editors.t, handles: Handles.t, action, state) => {
  switch (action) {
  | Activate =>
    switch (state.mountAt) {
    | Bottom(_) => Update({...state, activated: true})
    | Pane(tab) =>
      UpdateWithSideEffects({...state, activated: true}, _ => tab.activate())
    }
  | Deactivate => Update({...state, activated: false})
  | SetQueryRef(ref) =>
    SideEffects(_self => editors.query |> MiniEditor.Model.setRef(ref))
  | Focus(sort) => SideEffects(_self => editors |> Editors.Focus.on(sort))
  | MountTo(mountTo) =>
    SideEffects(self => mountPanel(editors, self, mountTo))
  | ToggleDocking =>
    switch (state.mountAt) {
    | Bottom(_) => SideEffects(self => self.send(MountTo(ToPane)))
    | Pane(_) => SideEffects(self => self.send(MountTo(ToBottom)))
    }
  /* UpdateWithSideEffects() */
  | ToggleSettingsTab(open_) =>
    SideEffects(
      self =>
        switch (state.settingsView) {
        | None =>
          if (open_) {
            let tab =
              Tab.make(
                ~editor=editors.source,
                ~getTitle=
                  () =>
                    "[Settings] " ++ Atom.TextEditor.getTitle(editors.source),
                ~onOpen=
                  (element, _, _) => {
                    open Handles;
                    let {
                      inquireConnection,
                      onInquireConnection,
                      updateConnection,
                    } = handles;
                    ReactDOMRe.render(
                      <Settings
                        inquireConnection
                        onInquireConnection
                        updateConnection
                        navigate={handles.navigateSettingsView}
                      />,
                      element,
                    );
                    /* <Settings> is opened */
                    handles.onSettingsView |> Event.emitOk(true);
                  },
                ~onClose=
                  element => {
                    self.send(ToggleSettingsTab(false));
                    ReactDOMRe.unmountComponentAtNode(element);

                    /* <Settings> is closed */
                    handles.onSettingsView |> Event.emitOk(false);
                  },
                /* handles.activateSettingsView |> Event.send(false); */
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
        },
    )
  | UpdateSettingsView(settingsView) => Update({...state, settingsView})
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
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
  },
  render: self => {
    let {header, body, mountAt, mode, activated} = self.state;
    let element: Webapi.Dom.Element.t =
      switch (mountAt) {
      | Bottom(element) => element
      | Pane(tab) => tab.element
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
          element
          header
          body
          mountAt
          hidden
          onMountAtChange={mountTo => self.send(MountTo(mountTo))}
          mode
          onInquireQuery={handles.onInquireQuery}
          /* editors */
          onEditorRef={ref => self.send(SetQueryRef(ref))}
          editorValue={editors.query.value}
          editorPlaceholder={editors.query.placeholder}
          interceptAndInsertKey={handles.interceptAndInsertKey}
          activateInputMethod={handles.activateInputMethod}
          activateSettingsView={handles.activateSettingsView}
          onSettingsViewToggle={status =>
            self.send(ToggleSettingsTab(status))
          }
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
