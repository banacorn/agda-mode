open ReasonReact;

open Type.Interaction;

open Webapi.Dom;

/************************************************************************************************************/

module Msg = Util.Msg;

module Handles = {
  type t = {
    updateHeader: ref(header => unit),
    updateRawBody: ref(rawBody => unit),
    updateMode: ref(mode => unit),
    updateMountTo: ref(mountTo => unit),
    updateActivation: ref(bool => unit),
    inquireConnection: Msg.t((string, string), string),
    inquireQuery: Msg.t((string, string), string),
    interceptAndInsertKey: ref(string => unit),
    activateInputMethod: ref(bool => unit),
    activateSettingsView: Msg.t(bool, unit),
    navigateSettingsView: Msg.t(Settings.uri, unit),
    destroy: ref(unit => unit),
  };

  let hook = (f, handle) => f := handle;

  /* creates all refs and return them */
  let make = () => {
    let updateHeader = ref(_ => ());

    let updateRawBody = ref(_ => ());

    let updateMode = ref(_ => ());

    let updateActivation = ref(_ => ());

    let updateMountTo = ref(_ => ());

    let inquireConnection = Msg.make();

    let inquireQuery = Msg.make();

    let interceptAndInsertKey = ref(_ => ());

    let activateInputMethod = ref(_ => ());

    let activateSettingsView = Msg.make();

    let navigateSettingsView = Msg.make();

    let destroy = ref(_ => ());

    {
      updateHeader,
      updateRawBody,
      updateMode,
      updateActivation,
      updateMountTo,
      inquireConnection,
      inquireQuery,
      interceptAndInsertKey,
      activateInputMethod,
      activateSettingsView,
      navigateSettingsView,
      destroy,
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
  header,
  body,
  mountAt,
  activated: bool,
  settingsView: option(Tab.t),
  editors: Editors.t,
  connectionEditorModel: MiniEditor.Model.t,
  connectionEditorMessage: string,
  connectionEditorRef: option(Atom.TextEditor.t),
  mode,
};

let initialState = (textEditor, _) => {
  {
    header: {
      text: "",
      style: "",
    },
    body: {
      maxHeight: 170,
      raw: Unloaded,
    },
    mountAt: Bottom(createElement()),
    activated: false,
    settingsView: None,
    editors: Editors.make(textEditor),
    connectionEditorModel: MiniEditor.Model.make(),
    connectionEditorMessage: "",
    connectionEditorRef: None,
    mode: Display,
  };
};

type action =
  | SetConnectionRef(Atom.TextEditor.t)
  | InquireConnection(string, string)
  | Focus(Editors.sort)
  /* Query Editor related */
  | SetQueryRef(Atom.TextEditor.t)
  | InquireQuery(string, string)
  /* Settings Tab related */
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  /*  */
  | UpdateMountAt(mountAt)
  | MountTo(mountTo)
  | Activate
  | Deactivate
  /*  */
  | UpdateHeader(header)
  | UpdateRawBody(rawBody)
  | UpdateMode(mode);

let mountPanel = (self, mountTo) => {
  let createTab = () =>
    Tab.make(
      ~editor=self.state.editors.source,
      ~getTitle=
        () =>
          "[Agda Mode] "
          ++ Atom.TextEditor.getTitle(self.state.editors.source),
      ~onClose=() => self.send(MountTo(ToBottom)),
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

let reducer = (handles: Handles.t, action, state) => {
  switch (action) {
  | Activate =>
    switch (state.mountAt) {
    | Bottom(_) => Update({...state, activated: true})
    | Pane(tab) =>
      UpdateWithSideEffects({...state, activated: true}, _ => tab.activate())
    }
  | Deactivate => Update({...state, activated: false})
  | SetConnectionRef(ref) =>
    Update({...state, connectionEditorRef: Some(ref)})
  | SetQueryRef(ref) =>
    Update({
      ...state,
      editors: {
        ...state.editors,
        query: {
          ...state.editors.query,
          ref: Some(ref),
        },
      },
    })
  | Focus(sort) =>
    UpdateWithSideEffects(
      {
        ...state,
        editors: {
          ...state.editors,
          focused: sort,
        },
      },
      self => self.state.editors |> Editors.Focus.on(sort),
    )
  | InquireConnection(message, value) =>
    UpdateWithSideEffects(
      {...state, connectionEditorMessage: message},
      self => self.state.editors |> Editors.Focus.on(Editors.Query),
    )
  | InquireQuery(placeholder, value) =>
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
      self => self.state.editors |> Editors.Focus.on(Editors.Query),
    )
  | MountTo(mountTo) => SideEffects(self => mountPanel(self, mountTo))
  | ToggleSettingsTab(open_) =>
    SideEffects(
      self =>
        switch (state.settingsView) {
        | None =>
          if (open_) {
            let tab =
              Tab.make(
                ~editor=self.state.editors.source,
                ~getTitle=
                  () =>
                    "[Settings] "
                    ++ Atom.TextEditor.getTitle(self.state.editors.source),
                ~onOpen=
                  (element, _, _) => {
                    let {connectionEditorModel, connectionEditorMessage} =
                      self.state;
                    ReactDOMRe.render(
                      <Settings
                        connectionEditorModel
                        connectionEditorMessage
                        onConnectionEditorRef={ref =>
                          self.send(SetConnectionRef(ref))
                        }
                        navigate={__x =>
                          Msg.recv(__x, handles.navigateSettingsView)
                        }
                      />,
                      element,
                    );
                    handles.activateSettingsView |> Msg.resolve();
                  },
                ~onClose=
                  () => {
                    self.send(ToggleSettingsTab(false));
                    handles.activateSettingsView |> Msg.send(false) |> ignore;
                  },
                (),
              );
            self.send(UpdateSettingsView(Some(tab)));
          }
        | Some(tab) =>
          if (!open_) {
            tab.kill();
            self.send(UpdateSettingsView(None));
          }
        },
    )
  | UpdateSettingsView(settingsView) => Update({...state, settingsView})
  | UpdateMountAt(mountAt) => Update({...state, mountAt})
  | UpdateHeader(header) => Update({...state, header})
  | UpdateRawBody(raw) => Update({
                            ...state,
                            body: {
                              ...state.body,
                              raw,
                            },
                          })
  | UpdateMode(mode) => Update({...state, mode})
  };
};

let component = reducerComponent("View");

let make = (~textEditor: Atom.TextEditor.t, ~handles: Handles.t, _children) => {
  ...component,
  initialState: initialState(textEditor),
  reducer: reducer(handles),
  didMount: self => {
    Handles.hook(handles.updateMountTo, mountTo =>
      self.send(MountTo(mountTo))
    );
    Handles.hook(handles.updateMode, mode => self.send(UpdateMode(mode)));
    Handles.hook(handles.updateActivation, activate =>
      self.send(activate ? Activate : Deactivate)
    );
    Handles.hook(handles.updateHeader, header =>
      self.send(UpdateHeader(header))
    );
    Handles.hook(handles.updateRawBody, rawBody =>
      self.send(UpdateRawBody(rawBody))
    );

    handles.inquireConnection
    |> Msg.recv(((message, value)) => {
         self.send(InquireConnection(message, value));
         handles.inquireConnection
         |> Msg.handlePromise(
              MiniEditor.Model.inquire(self.state.connectionEditorModel),
            );
       });

    handles.inquireQuery
    |> Msg.recv(((placeholder, value)) => {
         self.send(InquireQuery(placeholder, value));
         handles.inquireQuery
         |> Msg.handlePromise(
              MiniEditor.Model.inquire(self.state.editors.query),
            );
       });

    Handles.hook(handles.destroy, _ => Js.log("destroy!"));

    handles.activateSettingsView
    |> Msg.recv(activate => self.send(ToggleSettingsTab(activate)));
  },
  render: self => {
    let {header, body, mountAt, mode, activated, editors} = self.state;
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
          handles.activateInputMethod^(false);
          self.send(Focus(Source));
          self.send(UpdateMode(Display));
        }}
        onEditorCancel={(.) => {
          editors.query |> MiniEditor.Model.reject(Editors.QueryCancelled);
          handles.activateInputMethod^(false);
          self.send(Focus(Source));
          self.send(UpdateMode(Display));
        }}
        onEditorRef={ref => self.send(SetQueryRef(ref))}
        editorValue={editors.query.value}
        editorPlaceholder={editors.query.placeholder}
        interceptAndInsertKey={Handles.hook(handles.interceptAndInsertKey)}
        activateInputMethod={Handles.hook(handles.activateInputMethod)}
        activateSettingsView={__x =>
          Msg.recv(__x, handles.activateSettingsView)
        }
        onSettingsViewToggle={status => self.send(ToggleSettingsTab(status))}
      />
    </>;
  },
};

let initialize = textEditor => {
  let element = document |> Document.createElement("article");
  let handles = Handles.make();
  ReactDOMRe.render(
    ReasonReact.element(make(~textEditor, ~handles, [||])),
    element,
  );
  handles;
};
