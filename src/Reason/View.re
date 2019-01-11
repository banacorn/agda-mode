open ReasonReact;

open Type.Interaction;

open Webapi.Dom;

exception EditorNotSet;

module Handle = {
  type t = {
    updateHeader: ref(header => unit),
    updateRawBody: ref(rawBody => unit),
    updateMode: ref(mode => unit),
    updateMountTo: ref(mountTo => unit),
    inquireQuery: ref((string, string) => Js.Promise.t(string)),
    interceptAndInsertKey: ref(string => unit),
    inputMethodHandle: ref(bool => unit),
    settingsViewHandle: ref(bool => unit),
  };
  let updateHeader = ref(_ => ());

  let updateRawBody = ref(_ => ());

  let updateMode = ref(_ => ());

  let updateMountTo = ref(_ => ());
  let inquireQuery =
    ref((_, _) => Js.Promise.reject(Util.TelePromise.Uninitialized));

  let interceptAndInsertKey = ref(_ => ());

  let inputMethodHandle = ref(_ => ());

  let settingsViewHandle = ref(_ => ());

  let collection = {
    updateHeader,
    updateRawBody,
    updateMode,
    updateMountTo,
    inquireQuery,
    interceptAndInsertKey,
    inputMethodHandle,
    settingsViewHandle,
  };

  /* these "Hooked" callbacks sets the refs */
  module Hooked = {
    let updateHeader = handle => updateHeader := handle;
    let updateRawBody = handle => updateRawBody := handle;
    let updateMode = handle => updateMode := handle;
    let updateMountTo = handle => updateMountTo := handle;
    let inquireQuery = handle => inquireQuery := handle;
    let interceptAndInsertKey = handle => interceptAndInsertKey := handle;
    let inputMethodHandle = handle => inputMethodHandle := handle;
    let settingsViewHandle = handle => settingsViewHandle := handle;
  };
};

type state = {
  header,
  body,
  mountAt,
  settingsView: option(Tab.t),
  editor: Editor.t,
  mode,
};

let initialState = (editor, _) => {
  header: {
    text: "",
    style: "",
  },
  body: {
    maxHeight: 170,
    raw: Unloaded,
  },
  mountAt: Nowhere,
  settingsView: None,
  editor: Editor.make(editor),
  mode: Display,
};

type action =
  | SetGeneralRef(Atom.TextEditor.t)
  | FocusQuery
  | InquireQuery(string, string)
  | FocusSource
  | MountTo(mountTo)
  | ToggleSettingsTab(bool)
  | UpdateSettingsView(option(Tab.t))
  | UpdateMountAt(mountAt)
  | UpdateHeader(header)
  | UpdateRawBody(rawBody)
  | UpdateMode(mode);

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

let mountPanel = (self, mountTo) => {
  let createTab = () =>
    Tab.make(
      ~editor=self.state.editor.source,
      /* tab closed */
      ~onClose=() => self.send(MountTo(ToBottom)),
      (),
    );
  switch (self.state.mountAt, mountTo) {
  | (Bottom(_), ToBottom) => ()
  | (Bottom(_), ToPane) => self.send(UpdateMountAt(Pane(createTab())))
  | (Bottom(_), ToNowhere) => self.send(UpdateMountAt(Nowhere))
  | (Pane(tab), ToBottom) =>
    tab.kill();
    self.send(UpdateMountAt(Bottom(createElement())));
  | (Pane(_), ToPane) => ()
  | (Pane(tab), ToNowhere) =>
    tab.kill();
    self.send(UpdateMountAt(Nowhere));
  | (Nowhere, ToBottom) =>
    self.send(UpdateMountAt(Bottom(createElement())))
  | (Nowhere, ToPane) => self.send(UpdateMountAt(Pane(createTab())))
  | (Nowhere, ToNowhere) => ()
  };
};

let reducer = (action, state) =>
  switch (action) {
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
                ~onClose=
                  () => {
                    self.send(ToggleSettingsTab(false));
                    Handle.settingsViewHandle^(false);
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

let component = reducerComponent("View");

let make =
    (
      ~editor: Atom.TextEditor.t,
      ~updateRawBody: (rawBody => unit) => unit,
      ~updateHeader: (header => unit) => unit,
      ~updateMode: (mode => unit) => unit,
      ~updateMountTo: (mountTo => unit) => unit,
      ~inquireQuery: ((string, string) => Js.Promise.t(string)) => unit,
      /* input method */
      ~interceptAndInsertKey: (string => unit) => unit,
      ~inputMethodHandle: (bool => unit) => unit,
      ~settingsViewHandle: (bool => unit) => unit,
      _children,
    ) => {
  ...component,
  initialState: initialState(editor),
  reducer,
  didMount: self => {
    updateMountTo(mountTo => self.send(MountTo(mountTo)));
    updateHeader(header => self.send(UpdateHeader(header)));
    updateRawBody(rawBody => self.send(UpdateRawBody(rawBody)));
    updateMode(mode => self.send(UpdateMode(mode)));
    inquireQuery((placeholder, value) => {
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
    });
  },
  render: self => {
    let {header, body, mountAt, mode, editor} = self.state;
    let element: option(Element.t) =
      switch (mountAt) {
      | Nowhere => None
      | Bottom(element) => Some(element)
      | Pane(tab) => Some(tab.element)
      };
    <>
      <Panel
        editor
        element
        header
        body
        mountAt
        onMountAtChange={mountTo => self.send(MountTo(mountTo))}
        mode
        /* editors */
        onEditorFocused={focused =>
          self.send(focused ? FocusQuery : FocusSource)
        }
        onEditorConfirm={result => {
          Editor.(editor->(Query.answer(result)));
          Handle.inputMethodHandle^(false);
          self.send(FocusSource);
          self.send(UpdateMode(Display));
        }}
        onEditorCancel={(.) => {
          Editor.(editor->(Query.reject(QueryCancelled)));
          Handle.inputMethodHandle^(false);
          self.send(FocusSource);
          self.send(UpdateMode(Display));
        }}
        onEditorRef={ref => self.send(SetGeneralRef(ref))}
        editorValue={editor.query.value}
        editorPlaceholder={editor.query.placeholder}
        interceptAndInsertKey
        inputMethodHandle
        settingsViewHandle
        onSettingsViewToggle={status => self.send(ToggleSettingsTab(status))}
      />
    </>;
  },
};

/* exposed to the JS counterpart */
type jsHeaderState = {
  .
  "text": string,
  "style": string,
};

type jsEmacsBodyState = {
  .
  "kind": string,
  "header": string,
  "body": string,
};

type jsJSONBodyState = {
  .
  "kind": string,
  "rawJSON": Js.Json.t,
  "rawString": string,
};

let initialize = editor => {
  let element = document |> Document.createElement("article");
  open Handle.Hooked;
  ReactDOMRe.render(
    ReasonReact.element(
      make(
        ~editor,
        ~updateRawBody,
        ~updateHeader,
        ~updateMode,
        ~updateMountTo,
        ~inquireQuery,
        ~interceptAndInsertKey,
        ~inputMethodHandle,
        ~settingsViewHandle,
        [||],
      ),
    ),
    element,
  );

  Handle.collection;
};
