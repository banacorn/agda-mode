open ReasonReact;

open Type.Interaction;

open Webapi.Dom;

exception EditorNotSet;

type state = {
  header,
  body,
  mountAt,
  editors: Editors.t,
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
  editors: Editors.make(editor),
  mode: Display,
};

type action =
  | SetGeneralRef(Atom.TextEditor.t)
  | FocusGeneral
  | QueryGeneral(string, string)
  | FocusMain
  | MountTo(mountTo)
  | UpdateMountAt(mountAt)
  | UpdateHeader(header)
  | UpdateRawBody(rawBody)
  | UpdateMode(mode);

/* let editorRef = ref(None: option(Atom.TextEditor.t)); */
let createElement = () : Element.t => {
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

let mountPanel = (self, editor, mountTo) => {
  let createTab = () =>
    Tab.make(
      ~editor,
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
      editors: {
        ...state.editors,
        general: {
          ...state.editors.general,
          ref: Some(ref),
        },
      },
    })
  | FocusGeneral =>
    UpdateWithSideEffects(
      {
        ...state,
        editors: {
          ...state.editors,
          focused: Editors.General,
        },
      },
      (self => Editors.focusGeneral(self.state.editors)),
    )
  | FocusMain =>
    UpdateWithSideEffects(
      {
        ...state,
        editors: {
          ...state.editors,
          focused: Editors.Main,
        },
      },
      (self => Editors.focusMain(self.state.editors)),
    )
  | QueryGeneral(placeholder, value) =>
    UpdateWithSideEffects(
      {
        ...state,
        editors: {
          ...state.editors,
          general: {
            ...state.editors.general,
            placeholder,
            value,
          },
        },
      },
      (self => Editors.focusGeneral(self.state.editors)),
    )
  | MountTo(mountTo) =>
    SideEffects((self => mountPanel(self, state.editors.main, mountTo)))
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

let updateHeader = ref((_) => ());

let updateRawBody = ref((_) => ());

let updateMode = ref((_) => ());

let updateMountTo = ref((_) => ());

let queryGeneral =
  ref((_, _) => Js.Promise.reject(Util.TelePromise.Uninitialized));

let interceptAndInsertKey = ref((_) => ());

let activateInputMethod = ref(() => ());

let jsInterceptAndInsertKey = char => interceptAndInsertKey^(char);

let jsActivateInputMethod = () => activateInputMethod^();

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

let jsUpdateEmacsBody = (raw: jsEmacsBodyState) =>
  updateRawBody^(
    RawEmacs({kind: raw##kind, header: raw##header, body: raw##body}),
  );

let jsUpdateJSONBody = (raw: jsJSONBodyState) =>
  updateRawBody^(
    RawJSON({
      kind: raw##kind,
      rawJSON: raw##rawJSON,
      rawString: raw##rawString,
    }),
  );

let jsUpdateHeader = (raw: jsHeaderState) =>
  updateHeader^({text: raw##text, style: raw##style});

let jsUpdateMode = (mode: string) =>
  switch (mode) {
  | "display" => updateMode^(Display)
  | _ => updateMode^(Query)
  };

let jsQueryGeneral = (placeholder, value) =>
  queryGeneral^(placeholder, value);

let jsMountPanel = (jsMountTo: string) => {
  /* TODO */
  let translateJSMountTo = (jsMountTo: string) : mountTo =>
    switch (jsMountTo) {
    | "bottom" => ToBottom
    | "pane" => ToPane
    | _ => ToNowhere
    };
  updateMountTo^(translateJSMountTo(jsMountTo));
};

let component = reducerComponent("View");

let make =
    (
      ~editor: Atom.TextEditor.t,
      ~updateRawBody: (rawBody => unit) => unit,
      ~updateHeader: (header => unit) => unit,
      ~updateMode: (mode => unit) => unit,
      ~updateMountTo: (mountTo => unit) => unit,
      ~queryGeneral: ((string, string) => Js.Promise.t(string)) => unit,
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
    queryGeneral((placeholder, value) => {
      self.send(QueryGeneral(placeholder, value));
      let promise = Util.TelePromise.make();
      self.handle(
        (_, newSelf) =>
          Editors.queryGeneral(newSelf.state.editors)
          |> Js.Promise.then_(answer =>
               promise.resolve(answer) |> Js.Promise.resolve
             )
          |> ignore,
        (),
      );
      promise.wire();
    });
  },
  render: self => {
    let {header, body, mountAt, mode, editors} = self.state;
    let element: option(Element.t) =
      switch (mountAt) {
      | Nowhere => None
      | Bottom(element) => Some(element)
      | Pane(tab) => Some(tab.element)
      };
    <>
      <Panel
        editors
        element
        header
        body
        mountAt
        onMountAtChange=(mountTo => self.send(MountTo(mountTo)))
        mode
        /* editors */
        onEditorFocus=((.) => self.send(FocusGeneral))
        onEditorConfirm=(
          result => {
            Editors.answerGeneral(editors, result);
            self.send(FocusMain);
            self.send(UpdateMode(Display));
          }
        )
        onEditorCancel=(
          (.) => {
            Editors.rejectGeneral(editors, Editors.QueryCanceled);
            self.send(FocusMain);
            self.send(UpdateMode(Display));
          }
        )
        onEditorRef=(ref => self.send(SetGeneralRef(ref)))
        editorValue=editors.general.value
        editorPlaceholder=editors.general.placeholder
        /* inputMethod */
        interceptAndInsertKey=(handle => interceptAndInsertKey := handle)
        activateInputMethod=(handle => activateInputMethod := handle)
      />
    </>;
  },
};

let initialize = editor => {
  let element = document |> Document.createElement("article");
  ReactDOMRe.render(
    ReasonReact.element(
      make(
        ~editor,
        ~updateRawBody=handle => updateRawBody := handle,
        ~updateHeader=handle => updateHeader := handle,
        ~queryGeneral=handle => queryGeneral := handle,
        ~updateMode=handle => updateMode := handle,
        ~updateMountTo=handle => updateMountTo := handle,
        [||],
      ),
    ),
    element,
  );
};
