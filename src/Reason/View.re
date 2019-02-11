open ReasonReact;

open Type.View;

open Webapi.Dom;

/************************************************************************************************************/

module Event = Util.Event;

module Handles = {
  type t = {
    updateHeader: Event.t(Header.t),
    updateBody: Event.t(body),
    updateMode: ref(mode => unit),
    updateMountTo: ref(mountTo => unit),
    activatePanel: Event.t(bool),
    updateConnection: Event.t(option(Connection.t)),
    inquireConnection: Event.t((option(Connection.error), string)),
    onInquireConnection: Event.t(string),
    inquireQuery: Event.t((string, string)),
    activateSettingsView: Event.t(bool),
    onSettingsView: Event.t(bool),
    navigateSettingsView: Event.t(Settings.uri),
    destroy: ref(unit => unit),
    /* Input Method */
    activateInputMethod: Event.t(bool),
    interceptAndInsertKey: Event.t(string),
  };

  let hook = (f, handle) => f := handle;

  /* creates all refs and return them */
  let make = () => {
    let activatePanel = Event.make();

    let updateHeader = Event.make();

    let updateBody = Event.make();

    let updateMode = ref(_ => ());

    let updateMountTo = ref(_ => ());

    let updateConnection = Event.make();
    let inquireConnection = Event.make();
    let onInquireConnection = Event.make();

    let inquireQuery = Event.make();

    let activateSettingsView = Event.make();

    let onSettingsView = Event.make();

    let navigateSettingsView = Event.make();

    let destroy = ref(_ => ());

    let interceptAndInsertKey = Event.make();

    let activateInputMethod = Event.make();

    {
      activatePanel,
      updateHeader,
      updateBody,
      updateMode,
      updateMountTo,
      updateConnection,
      inquireConnection,
      onInquireConnection,
      inquireQuery,
      activateSettingsView,
      onSettingsView,
      navigateSettingsView,
      destroy,
      activateInputMethod,
      interceptAndInsertKey,
    };
  };
};

/************************************************************************************************************/

let createElement = (): Element.t => {
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
  /* | InquireConnection(string, string) */
  | Focus(Editors.sort)
  /* Query Editor related */
  | SetQueryRef(Atom.TextEditor.t)
  /* | InquireQuery(string, string) */
  /* Settings Tab related */
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  /*  */
  | UpdateMountAt(mountAt)
  | MountTo(mountTo)
  | Activate
  | Deactivate
  /*  */
  | UpdateHeader(Header.t)
  | UpdateBody(body)
  | UpdateMode(mode);

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
  /* | InquireConnection(message, value) =>
     UpdateWithSideEffects(
       {...state, connectionEditorMessage: message},
       self => self.state.editors |> Editors.Focus.on(Editors.Query),
     ) */
  /* | InquireQuery(placeholder, value) =>
     UpdateWithSideEffects(
       {
         ...state,
         editors: {
           ...state.editors,
           query: {
             ...state.editors.query,
             placeholder,
             value,
           },
         },
       },
       self => {
         handles.onEditorsUpdate |> Event.resolve(self.state.editors);
         self.state.editors |> Editors.Focus.on(Editors.Query);
       },
     ) */
  | MountTo(mountTo) =>
    SideEffects(self => mountPanel(editors, self, mountTo))
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
                    handles.onSettingsView |> Event.resolve(true);
                  },
                ~onClose=
                  element => {
                    self.send(ToggleSettingsTab(false));
                    ReactDOMRe.unmountComponentAtNode(element);

                    /* <Settings> is closed */
                    handles.onSettingsView |> Event.resolve(false);
                  },
                /* handles.activateSettingsView |> Event.send(false); */
                (),
              );
            self.send(UpdateSettingsView(Some(tab)));
          }
        | Some(tab) =>
          if (open_) {
            /* <Settings> is opened */
            handles.onSettingsView |> Event.resolve(true);
          } else {
            tab.kill();
            self.send(UpdateSettingsView(None));
            /* <Settings> is closed */
            handles.onSettingsView |> Event.resolve(false);
          }
        },
    )
  | UpdateSettingsView(settingsView) => Update({...state, settingsView})
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
  | UpdateHeader(header) => Update({...state, header})
  | UpdateBody(body) => Update({...state, body})
  | UpdateMode(mode) => Update({...state, mode})
  };
};

let component = reducerComponent("View");

let make = (~editors: Editors.t, ~handles: Handles.t, _children) => {
  ...component,
  initialState,
  reducer: reducer(editors, handles),
  didMount: self => {
    open Util.Event;

    /* activate/deactivate <Panel> */
    handles.activatePanel
    |> on(activate => self.send(activate ? Activate : Deactivate))
    |> destroyWhen(self.onUnmount);

    /* update <Header> */
    handles.updateHeader
    |> on(header => self.send(UpdateHeader(header)))
    |> destroyWhen(self.onUnmount);

    /* update <Body> */
    handles.updateBody
    |> on(body => self.send(UpdateBody(body)))
    |> destroyWhen(self.onUnmount);

    Handles.hook(handles.updateMountTo, mountTo =>
      self.send(MountTo(mountTo))
    );
    Handles.hook(handles.updateMode, mode => self.send(UpdateMode(mode)));

    /* handles.inquireQuery
       |> Event.recv(self.onUnmount)
       |> thenDrop(((placeholder, value)) =>
            self.send(
              InquireQuery(placeholder, value),
              /* handles.inquireQuery
                 |> Event.handlePromise(
                      MiniEditor.Model.inquire(self.state.editors.query),
                    ); */
            )
          ); */

    Handles.hook(handles.destroy, _ => Js.log("destroy!"));

    /* opening/closing <Settings> */
    handles.activateSettingsView
    |> on(activate => self.send(ToggleSettingsTab(activate)))
    |> destroyWhen(self.onUnmount);
  },
  render: self => {
    let {header, body, mountAt, mode, activated} = self.state;
    let element: Element.t =
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
      <Panel
        editors
        element
        header
        body
        mountAt
        hidden
        onMountAtChange={mountTo => self.send(MountTo(mountTo))}
        mode
        /* editors */
        onEditorFocused={focused =>
          self.send(focused ? Focus(Query) : Focus(Source))
        }
        onEditorConfirm={result => {
          editors.query |> MiniEditor.Model.answer(result);
          handles.activateInputMethod |> Event.resolve(false);
          self.send(Focus(Source));
          self.send(UpdateMode(Display));
        }}
        onEditorCancel={(.) => {
          editors.query |> MiniEditor.Model.reject(Editors.QueryCancelled);
          handles.activateInputMethod |> Event.resolve(false);
          self.send(Focus(Source));
          self.send(UpdateMode(Display));
        }}
        onEditorRef={ref => self.send(SetQueryRef(ref))}
        editorValue={editors.query.value}
        editorPlaceholder={editors.query.placeholder}
        interceptAndInsertKey={handles.interceptAndInsertKey}
        activateInputMethod={handles.activateInputMethod}
        activateSettingsView={handles.activateSettingsView}
        onSettingsViewToggle={status => self.send(ToggleSettingsTab(status))}
      />
    </>;
  },
};

let initialize = editors => {
  let element = document |> Document.createElement("article");
  let handles = Handles.make();
  let component = ReasonReact.element(make(~editors, ~handles, [||]));
  ReactDOMRe.render(component, element);
  /* return the handles for drilling */
  handles;
};
