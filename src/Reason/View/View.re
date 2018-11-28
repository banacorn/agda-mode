open ReasonReact;

open Type.Interaction;

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

let updateEmacsBody = ref((_) => ());

let updateJSONBody = ref((_) => ());

let updateHeader = ref((_) => ());

let renderPanel = element =>
  ReactDOMRe.render(
    <Panel
      updateEmacsBody=(handle => updateEmacsBody := handle)
      updateJSONBody=(handle => updateJSONBody := handle)
      updateHeader=(handle => updateHeader := handle)
    />,
    element,
  );

/* TODO */
let translateJSMountAt = (jsMountAt: string) : mountAt =>
  switch (jsMountAt) {
  | "bottom" => Bottom
  | "pane" => Pane
  | _ => Nowhere
  };

let mountingPosition = ref(Nowhere);

let mountPanel = (jsMountAt: string) =>
  switch (mountingPosition^, translateJSMountAt(jsMountAt)) {
  | (Bottom, Bottom) => ()
  | (Bottom, Pane) => ()
  | (Bottom, Nowhere) => ()
  | (Pane, Bottom) => ()
  | (Pane, Pane) => ()
  | (Pane, Nowhere) => ()
  | (Nowhere, Bottom) => ()
  | (Nowhere, Pane) => ()
  | (Nowhere, Nowhere) => ()
  };

/* switch (mountingPosition^) {
   | Bottom => ()
   | Pane => ()
   | Nowhere =>
     switch (translateJSMountAt(jsMountAt)) {
     | Bottom =>
       open Webapi.Dom;
       open DomTokenListRe;
       let element = document |> Document.createElement("article");
       element |> Element.classList |> add("agda-mode");
       Atom.Environment.Workspace.addBottomPanel({
         "item": element,
         "visible": true,
       });
       renderPanel(element);
     | Pane => Js.log("open tab panel")
     /* this.tabs.open('panel') */
     | Nowhere => ()
     }
   }; */
/* let renderPanel = () => {
     open Webapi.Dom;
     open DomTokenListRe;
     let element = document |> Document.createElement("article");
     element |> Element.classList |> add("agda-mode");
     Atom.Environment.Workspace.addBottomPanel({
       "item": element,
       "visible": true,
     })
     |> ignore;
     ReactDOMRe.render(
       <Panel
         updateEmacsBody=(handle => updateEmacsBody := handle)
         updateJSONBody=(handle => updateJSONBody := handle)
         updateHeader=(handle => updateHeader := handle)
       />,
       element,
     );
   }; */
let jsUpdateEmacsBody = (raw: jsEmacsBodyState) =>
  updateEmacsBody^({kind: raw##kind, header: raw##header, body: raw##body});

let jsUpdateJSONBody = (raw: jsJSONBodyState) =>
  updateJSONBody^({
    kind: raw##kind,
    rawJSON: raw##rawJSON,
    rawString: raw##rawString,
  });

let jsUpdateHeader = (raw: jsHeaderState) =>
  updateHeader^({text: raw##text, style: raw##style});
