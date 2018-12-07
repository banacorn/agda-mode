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
  | UpdateEditors(Editors.t)
  | QueryGeneral(string, string)
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
  | (Bottom(element), ToPane) =>
    ReactDOMRe.unmountComponentAtNode(element);
    let tab = createTab();
    self.send(UpdateMountAt(Pane(tab)));
  | (Bottom(element), ToNowhere) =>
    self.send(UpdateMountAt(Nowhere));
    ReactDOMRe.unmountComponentAtNode(element);
  | (Pane(tab), ToBottom) =>
    tab.kill();
    let element = createElement();
    self.send(UpdateMountAt(Bottom(element)));
  | (Pane(_), ToPane) => ()
  | (Pane(tab), ToNowhere) =>
    tab.kill();
    self.send(UpdateMountAt(Nowhere));
  | (Nowhere, ToBottom) =>
    let element = createElement();
    self.send(UpdateMountAt(Bottom(element)));
  | (Nowhere, ToPane) =>
    let tab = createTab();
    self.send(UpdateMountAt(Pane(tab)));
  | (Nowhere, ToNowhere) => ()
  };
};

let renderPanel = self => {
  let {header, body, mountAt, mode, editors} = self.state;
  let component =
    <Panel
      header
      body
      mountAt
      onMountAtChange=(mountTo => self.send(MountTo(mountTo)))
      mode
      /* editors */
      onEditorConfirm=(
        result => {
          Editors.focusMain(editors);
          Editors.answerGeneral(editors, result);
          self.send(UpdateMode(Display));
        }
      )
      onEditorCancel=(
        (.) => {
          Editors.focusMain(editors);
          Editors.rejectGeneral(editors, Editors.QueryCanceled);
          self.send(UpdateMode(Display));
        }
      )
      onEditorRef=(
        ref =>
          self.send(
            UpdateEditors({
              ...editors,
              general: {
                ...editors.general,
                ref: Some(ref),
              },
            }),
          )
      )
      editorValue=editors.general.value
      editorPlaceholder=editors.general.placeholder
    />;
  switch (mountAt) {
  | Nowhere => ()
  | Bottom(element) => ReactDOMRe.render(component, element)
  | Pane(tab) => ReactDOMRe.render(component, tab.element)
  };
};

let reducer = (action, state) =>
  switch (action) {
  | UpdateEditors(editors) =>
    UpdateWithSideEffects({...state, editors}, renderPanel)
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
      (
        self => {
          Editors.focusGeneral(self.state.editors);
          renderPanel(self);
        }
      ),
    )
  | MountTo(mountTo) =>
    SideEffects((self => mountPanel(self, state.editors.main, mountTo)))
  | UpdateMountAt(mountAt) =>
    UpdateWithSideEffects({...state, mountAt}, renderPanel)
  | UpdateHeader(header) =>
    UpdateWithSideEffects({...state, header}, renderPanel)
  | UpdateRawBody(raw) =>
    UpdateWithSideEffects(
      {
        ...state,
        body: {
          ...state.body,
          raw,
        },
      },
      renderPanel,
    )
  | UpdateMode(mode) => UpdateWithSideEffects({...state, mode}, renderPanel)
  };

let updateHeader = ref((_) => ());

let updateRawBody = ref((_) => ());

let updateMode = ref((_) => ());

let updateMountTo = ref((_) => ());

let queryGeneral =
  ref((_, _) => Js.Promise.reject(Util.TelePromise.Uninitialized));

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
  render: _self => null,
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
