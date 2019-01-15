open ReasonReact;

open Type.Interaction;

open Webapi.Dom;

/************************************************************************************************************/

module Handles = {
  type t = {
    updateHeader: ref(header => unit),
    updateRawBody: ref(rawBody => unit),
    updateMode: ref(mode => unit),
    updateMountTo: ref(mountTo => unit),
    updateActivation: ref(bool => unit),
    inquireQuery: ref((string, string) => Js.Promise.t(string)),
    interceptAndInsertKey: ref(string => unit),
    activateInputMethod: ref(bool => unit),
    activateSettingsView: ref(bool => unit),
  };

  let hook = (f, handle) => f := handle;

  /* creates all refs and return them */
  let make = () => {
    let updateHeader = ref(_ => ());

    let updateRawBody = ref(_ => ());

    let updateMode = ref(_ => ());

    let updateActivation = ref(_ => ());

    let updateMountTo = ref(_ => ());
    let inquireQuery =
      ref((_, _) => Js.Promise.reject(Util.TelePromise.Uninitialized));

    let interceptAndInsertKey = ref(_ => ());

    let activateInputMethod = ref(_ => ());

    let activateSettingsView = ref(_ => ());

    {
      updateHeader,
      updateRawBody,
      updateMode,
      updateActivation,
      updateMountTo,
      inquireQuery,
      interceptAndInsertKey,
      activateInputMethod,
      activateSettingsView,
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
  editor: Editor.t,
  mode,
};

let initialState = (editor, _) => {
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
    editor: Editor.make(editor),
    mode: Display,
  };
};

type action =
  | SetGeneralRef(Atom.TextEditor.t)
  | FocusQuery
  | InquireQuery(string, string)
  | FocusSource
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  | UpdateMountAt(mountAt)
  | UpdateHeader(header)
  | UpdateRawBody(rawBody)
  | UpdateMode(mode)
  | MountTo(mountTo)
  | Activate
  | Deactivate;

let mountPanel = (self, mountTo) => {
  let createTab = () =>
    Tab.make(
      ~editor=self.state.editor.source,
      ~getTitle=
        () =>
          "[Agda Mode] " ++ Atom.TextEditor.getTitle(self.state.editor.source),
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
  | SetGeneralRef(ref) =>
    Update({
      ...state,
      editor: {
        ...state.editor,
        query: {
          ...state.editor.query,
          ref: Some(ref),
        },
      },
    })
  | FocusQuery =>
    UpdateWithSideEffects(
      {
        ...state,
        editor: {
          ...state.editor,
          focused: Editor.Query,
        },
      },
      self => Editor.Focus.onQuery(self.state.editor),
    )
  | FocusSource =>
    UpdateWithSideEffects(
      {
        ...state,
        editor: {
          ...state.editor,
          focused: Editor.Source,
        },
      },
      self => Editor.Focus.onSource(self.state.editor),
    )
  | InquireQuery(placeholder, value) =>
    UpdateWithSideEffects(
      {
        ...state,
        editor: {
          ...state.editor,
          query: {
            ...state.editor.query,
            placeholder,
            value,
          },
        },
      },
      self => Editor.Focus.onQuery(self.state.editor),
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
                ~editor=self.state.editor.source,
                ~getTitle=
                  () =>
                    "[Settings] "
                    ++ Atom.TextEditor.getTitle(self.state.editor.source),
                ~onOpen=
                  (element, _, _) =>
                    ReactDOMRe.render(<Settings />, element),
                ~onClose=
                  () => {
                    self.send(ToggleSettingsTab(false));
                    handles.activateSettingsView^(false);
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

let make = (~editor: Atom.TextEditor.t, ~handles: Handles.t, _children) => {
  ...component,
  initialState: initialState(editor),
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
    Handles.hook(
      handles.inquireQuery,
      (placeholder, value) => {
        self.send(InquireQuery(placeholder, value));
        let promise = Util.TelePromise.make();
        self.handle(
          (_, newSelf) =>
            Js.Promise.(
              Editor.Query.inquire(newSelf.state.editor)
              |> then_(answer => promise.resolve(answer) |> resolve)
              |> catch(error =>
                   promise.reject(Util.JSPromiseError(error)) |> resolve
                 )
              |> ignore
            ),
          (),
        );
        promise.wire();
      },
    );
  },
  render: self => {
    let {header, body, mountAt, mode, activated, editor} = self.state;
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
        editor
        element
        header
        body
        mountAt
        hidden
        onMountAtChange={mountTo => self.send(MountTo(mountTo))}
        mode
        /* editors */
        onEditorFocused={focused =>
          self.send(focused ? FocusQuery : FocusSource)
        }
        onEditorConfirm={result => {
          Editor.(editor->(Query.answer(result)));
          handles.activateInputMethod^(false);
          self.send(FocusSource);
          self.send(UpdateMode(Display));
        }}
        onEditorCancel={(.) => {
          Editor.(editor->(Query.reject(QueryCancelled)));
          handles.activateInputMethod^(false);
          self.send(FocusSource);
          self.send(UpdateMode(Display));
        }}
        onEditorRef={ref => self.send(SetGeneralRef(ref))}
        editorValue={editor.query.value}
        editorPlaceholder={editor.query.placeholder}
        interceptAndInsertKey={Handles.hook(handles.interceptAndInsertKey)}
        activateInputMethod={Handles.hook(handles.activateInputMethod)}
        activateSettingsView={Handles.hook(handles.activateSettingsView)}
        onSettingsViewToggle={status => self.send(ToggleSettingsTab(status))}
      />
    </>;
  },
};

let initialize = editor => {
  let element = document |> Document.createElement("article");
  let handles = Handles.make();
  ReactDOMRe.render(
    ReasonReact.element(make(~editor, ~handles, [||])),
    element,
  );
  handles;
};
