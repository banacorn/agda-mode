open ReasonReact;

open Type.Interaction;

open Webapi.Dom;

open Rebase;

exception EditorNotSet;

/*
 type mountingPosition =
   | Bottom(Element.t)
   | Pane(Tab.handle)
   | Nowhere; */
type state = {
  header: ref(header),
  body: ref(body),
  mountAt: ref(mountAt),
};

let state = {
  header: ref({text: "", style: ""}),
  body: ref({maxHeight: 170, raw: Unloaded}),
  mountAt: ref(Nowhere),
};

let editorRef = ref(None: option(Atom.TextEditor.t));

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

let rec renderPanel = element => {
  let {header, body, mountAt} = state;
  ReactDOMRe.render(
    <Panel
      header=header^
      body=body^
      mountAt=mountAt^
      onMountAtChange=(mountTo => mountPanel(mountTo))
    />,
    element,
  );
}
and mountPanel = mountTo => {
  let createTab = () =>
    switch (editorRef^) {
    | Some(editor) =>
      Tab.make(
        ~editor,
        /* ~onOpen=(element, _) => renderPanel(element), */
        /* panel killed */
        ~onKill=() => (),
        /* tab closed */
        ~onClose=() => mountPanel(ToBottom),
        (),
      )
    | None => raise(EditorNotSet)
    };
  switch (state.mountAt^, mountTo) {
  | (Bottom(element), ToBottom) => renderPanel(element)
  | (Bottom(element), ToPane) =>
    ReactDOMRe.unmountComponentAtNode(element);
    let tab = createTab();
    state.mountAt := Pane(tab);
    renderPanel(tab.element);
  | (Bottom(element), ToNowhere) =>
    state.mountAt := Nowhere;
    ReactDOMRe.unmountComponentAtNode(element);
  | (Pane(tab), ToBottom) =>
    tab.kill();
    let element = createElement();
    state.mountAt := Bottom(element);
    renderPanel(element);
  | (Pane(tab), ToPane) => renderPanel(tab.element)
  | (Pane(tab), ToNowhere) =>
    Js.log("hey");
    tab.kill();
    state.mountAt := Nowhere;
  | (Nowhere, ToBottom) =>
    let element = createElement();
    state.mountAt := Bottom(element);
    renderPanel(element);
  | (Nowhere, ToPane) =>
    let tab = createTab();
    state.mountAt := Pane(tab);
    renderPanel(tab.element);
  | (Nowhere, ToNowhere) => ()
  };
};

let rerenderPanel = () =>
  switch (state.mountAt^) {
  | Bottom(_) => mountPanel(ToBottom)
  | Pane(_) => mountPanel(ToPane)
  | Nowhere => mountPanel(ToNowhere)
  };

let initialize = editor => editorRef := Some(editor);

let updateHeader = header => {
  state.header := header;
  rerenderPanel();
};

let updateBody = body => {
  state.body := body;
  rerenderPanel();
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

let jsUpdateEmacsBody = (raw: jsEmacsBodyState) =>
  updateBody({
    maxHeight: state.body^.maxHeight,
    raw: RawEmacs({kind: raw##kind, header: raw##header, body: raw##body}),
  });

let jsUpdateJSONBody = (raw: jsJSONBodyState) =>
  updateBody({
    maxHeight: state.body^.maxHeight,
    raw:
      RawJSON({
        kind: raw##kind,
        rawJSON: raw##rawJSON,
        rawString: raw##rawString,
      }),
  });

let jsUpdateHeader = (raw: jsHeaderState) =>
  updateHeader({text: raw##text, style: raw##style});

let jsMountPanel = (jsMountTo: string) => {
  /* TODO */
  let translateJSMountTo = (jsMountTo: string) : mountTo =>
    switch (jsMountTo) {
    | "bottom" => ToBottom
    | "pane" => ToPane
    | _ => ToNowhere
    };
  mountPanel(translateJSMountTo(jsMountTo));
};
