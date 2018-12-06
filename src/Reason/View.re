open ReasonReact;

open Type.Interaction;

open Webapi.Dom;

exception EditorNotSet;

type state = {
  header,
  body,
  mountAt,
  editor: Atom.TextEditor.t,
  mode,
  query,
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
  editor,
  mode: Display,
  query: {
    placeholder: "",
    value: "",
  },
};

type action =
  | MountTo(mountTo)
  | UpdateMountAt(mountAt)
  | UpdateHeader(header)
  | UpdateRawBody(rawBody)
  | UpdateMode(mode)
  | UpdateQuery(query);

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
      /* ~onOpen=(element, _) => renderPanel(element), */
      /* panel killed */
      ~onKill=() => (),
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
  let {header, body, mountAt, mode, query} = self.state;
  switch (mountAt) {
  | Nowhere => ()
  | Bottom(element) =>
    ReactDOMRe.render(
      <Panel
        header
        body
        mountAt
        onMountAtChange=(mountTo => self.send(MountTo(mountTo)))
        mode
        query
      />,
      element,
    )
  | Pane(tab) =>
    ReactDOMRe.render(
      <Panel
        header
        body
        mountAt
        onMountAtChange=(mountTo => self.send(MountTo(mountTo)))
        mode
        query
      />,
      tab.element,
    )
  };
};

let reducer = (action, state) =>
  switch (action) {
  | MountTo(mountTo) =>
    SideEffects((self => mountPanel(self, state.editor, mountTo)))
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
  | UpdateQuery(query) =>
    UpdateWithSideEffects({...state, query}, renderPanel)
  };

let updateHeader = ref((_) => ());

let updateRawBody = ref((_) => ());

let updateMode = ref((_) => ());

let updateQuery = ref((_) => ());

let updateMountTo = ref((_) => ());

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

type jsQueryState = {
  .
  "placeholder": string,
  "value": string,
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

let jsUpdateQuery = (obj: jsQueryState) =>
  updateQuery^({placeholder: obj##placeholder, value: obj##value});

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
      ~updateQuery: (query => unit) => unit,
      ~updateMode: (mode => unit) => unit,
      ~updateMountTo: (mountTo => unit) => unit,
      _children,
    ) => {
  ...component,
  initialState: initialState(editor),
  reducer,
  render: self => {
    updateMountTo(mountTo => self.send(MountTo(mountTo)));
    updateHeader(header => self.send(UpdateHeader(header)));
    updateRawBody(rawBody => self.send(UpdateRawBody(rawBody)));
    updateMode(mode => self.send(UpdateMode(mode)));
    updateQuery(query => self.send(UpdateQuery(query)));
    null;
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
        ~updateQuery=handle => updateQuery := handle,
        ~updateMode=handle => updateMode := handle,
        ~updateMountTo=handle => updateMountTo := handle,
        [||],
      ),
    ),
    element,
  );
};
