module Instance = {
  type t = {
    textEditor: Atom.TextEditor.t,
    view: View.Handle.t,
  };
  /* let initialize = (textEditor: TextEditor.t) => {}; */

  let make = (textEditor: Atom.TextEditor.t) => {
    {textEditor, view: View.initialize(textEditor)};
  };

  let activate = self => {
    self.view.updateMountTo^(Type.Interaction.ToBottom);
  };

  let deactivate = self => {
    self.view.updateMountTo^(Type.Interaction.ToNowhere);
  };

  let modeDisplay = self => {
    self.view.updateMode^(Type.Interaction.Display);
  };
  let modeQuery = self => {
    self.view.updateMode^(Type.Interaction.Query);
  };

  let interceptAndInsertKey = (self, key) => {
    self.view.interceptAndInsertKey^(key);
  };

  let inputMethodHandle = (self, activate) => {
    self.view.inputMethodHandle^(activate);
  };

  let updateRawBody = (self, raw) => {
    self.view.updateRawBody^(raw);
  };

  let updateHeader = (self, raw) => {
    self.view.updateHeader^(raw);
  };

  let inquireQuery = (self, placeholder, value) => {
    self.view.inquireQuery^(placeholder, value);
  };
};

exception InstanceNotFound;

let instances: Js.Dict.t(Instance.t) = Js.Dict.empty();

let initialize = (textEditor: Atom.TextEditor.t) => {
  let filepath = textEditor |> Atom.TextEditor.getPath;
  Js.log("initializing " ++ filepath);

  switch (Js.Dict.get(instances, filepath)) {
  | Some(_instance) => Js.log("already initialized: " ++ filepath)
  | None => Instance.make(textEditor) |> Js.Dict.set(instances, filepath)
  };
};

let lookup = textEditor => {
  let filepath = textEditor |> Atom.TextEditor.getPath;
  Js.Dict.get(instances, filepath);
};

let activate = textEditor => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.activate(instance) |> ignore
  | None =>
    Js.log(
      "cannot activate, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let deactivate = textEditor => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.deactivate(instance) |> ignore
  | None =>
    Js.log(
      "cannot deactivate, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let modeDisplay = textEditor => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.modeDisplay(instance) |> ignore
  | None =>
    Js.log(
      "cannot modeDisplay, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let modeQuery = textEditor => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.modeQuery(instance) |> ignore
  | None =>
    Js.log(
      "cannot modeQuery, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let interceptAndInsertKey = (textEditor, key) => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.interceptAndInsertKey(instance, key) |> ignore
  | None =>
    Js.log(
      "cannot interceptAndInsertKey, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let activateInputMethod = textEditor => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.inputMethodHandle(instance, true) |> ignore
  | None =>
    Js.log(
      "cannot activateInputMethod, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let deactivateInputMethod = textEditor => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.inputMethodHandle(instance, false) |> ignore
  | None =>
    Js.log(
      "cannot deactivateInputMethod, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let jsUpdateEmacsBody = (textEditor, raw) => {
  switch (lookup(textEditor)) {
  | Some(instance) =>
    Instance.updateRawBody(
      instance,
      Type.Interaction.RawEmacs({
        kind: raw##kind,
        header: raw##header,
        body: raw##body,
      }),
    )
    |> ignore
  | None =>
    Js.log(
      "cannot jsUpdateEmacsBody, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let jsUpdateJSONBody = (textEditor, raw) => {
  switch (lookup(textEditor)) {
  | Some(instance) =>
    Instance.updateRawBody(
      instance,
      Type.Interaction.RawJSON({
        kind: raw##kind,
        rawJSON: raw##rawJSON,
        rawString: raw##rawString,
      }),
    )
    |> ignore
  | None =>
    Js.log(
      "cannot jsUpdateJSONBody, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let jsUpdateHeader = (textEditor, raw) => {
  switch (lookup(textEditor)) {
  | Some(instance) =>
    Instance.updateHeader(instance, {text: raw##text, style: raw##style})
    |> ignore
  | None =>
    Js.log(
      "cannot jsUpdateHeader, does not exist: "
      ++ Atom.TextEditor.getPath(textEditor),
    )
  };
};

let jsInquireQuery = (textEditor, placeholder, value) => {
  switch (lookup(textEditor)) {
  | Some(instance) => Instance.inquireQuery(instance, placeholder, value)
  | None => Js.Promise.reject(InstanceNotFound)
  /* Js.log(
       "cannot jsInquireQuery, does not exist: "
       ++ Atom.TextEditor.getPath(textEditor),
     ); */
  };
};
