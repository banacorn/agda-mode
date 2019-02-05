open Rebase;

module Event = Util.Event;

open Util.Promise;
type t = {
  editors: Editors.t,
  view: View.Handles.t,
  mutable goals: array(Goal.t),
  mutable connection: option(Connection.t),
};
let make = (textEditor: Atom.TextEditor.t) => {
  /* adds "agda" to the class-list */
  Atom.Environment.Views.getView(textEditor)
  |> Webapi.Dom.HtmlElement.classList
  |> Webapi.Dom.DomTokenList.add("agda");
  /*  */
  let editors = Editors.make(textEditor);
  {editors, view: View.initialize(editors), goals: [||], connection: None};
};

let activate = self => {
  self.view.activatePanel |> Event.resolve(true);
};

let connect = self => {
  let queryConnection =
      (error: option(Connection.error), self): Js.Promise.t(string) => {
    activate(self);

    let p =
      self.view.onSettingsView
      |> Event.once
      |> then_(_ => {
           self.view.navigateSettingsView
           |> Event.resolve(Settings.URI.Connection);

           let promise = self.view.onInquireConnection |> Event.once;
           self.view.inquireConnection |> Event.resolve((error, ""));

           promise;
         });

    self.view.activateSettingsView |> Event.resolve(true);

    p;
  };
  let getAgdaPath = (): Js.Promise.t(string) => {
    let storedPath =
      Atom.Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
    if (storedPath |> String.isEmpty) {
      Connection.autoSearch("agda");
    } else {
      Js.Promise.resolve(storedPath);
    };
  };

  let rec getMetadata = (self, path) => {
    Connection.validateAndMake(path)
    |> catch(
         Connection.handleValidationError(err =>
           self
           |> queryConnection(Some(Connection.Validation(path, err)))
           |> then_(getMetadata(self))
         ),
       );
  };

  let persistConnection = (self, connection: Connection.t) => {
    self.connection = Some(connection);
    /* store the path in the config */
    Atom.Environment.Config.set(
      "agda-mode.agdaPath",
      connection.metadata.path,
    );
    /* update the view */
    self.view.updateConnection |> Event.resolve(Some(connection));
    /* pass it on */
    resolve(connection);
  };

  switch (self.connection) {
  | Some(connection) => resolve(connection)
  | None =>
    getAgdaPath()
    |> catch(
         Connection.handleAutoSearchError(err =>
           self |> queryConnection(Some(Connection.AutoSearch(err)))
         ),
       )
    |> then_(getMetadata(self))
    |> then_(Connection.connect)
    |> then_(persistConnection(self))
    |> then_(Connection.wire)
  };
};

let disconnect = self => {
  switch (self.connection) {
  | Some(connection) => Connection.disconnect(connection)
  | None => ()
  };
};

let getConnection = self => {
  switch (self.connection) {
  | Some(connection) => resolve(connection)
  | None => connect(self)
  };
};

let deactivate = self => {
  self.view.activatePanel |> Event.resolve(false);
};

let destroy = self => {
  deactivate(self);
  self.view.destroy^();
};

let prepareCommand =
    (command: Command.Bare.t, self): Js.Promise.t(option(Command.Packed.t)) => {
  let prepare = (command, self) => {
    getConnection(self)
    |> then_(connection =>
         Some(
           {
             connection,
             filepath: self.editors.source |> Atom.TextEditor.getPath,
             command,
           }: Command.Packed.t,
         )
         |> resolve
       );
  };
  switch (command) {
  | Load => self |> prepare(Load)
  | Quit =>
    disconnect(self);
    resolve(None);
  | Restart =>
    disconnect(self);
    self |> prepare(Load);
  | InputSymbol(symbol) =>
    let enabled = Atom.Environment.Config.get("agda-mode.inputMethod");
    if (enabled) {
      switch (symbol) {
      | Ordinary =>
        self.view.activatePanel |> Event.resolve(true);
        self.view.activateInputMethod |> Event.resolve(true);
      | CurlyBracket => self.view.interceptAndInsertKey |> Event.resolve("{")
      | Bracket => self.view.interceptAndInsertKey |> Event.resolve("[")
      | Parenthesis => self.view.interceptAndInsertKey |> Event.resolve("(")
      | DoubleQuote => self.view.interceptAndInsertKey |> Event.resolve("\"")
      | SingleQuote => self.view.interceptAndInsertKey |> Event.resolve("'")
      | BackQuote => self.view.interceptAndInsertKey |> Event.resolve("`")
      };
      ();
    } else {
      self.editors
      |> Editors.Focus.get
      |> Atom.TextEditor.insertText("\\")
      |> ignore;
    };
    resolve(None);
  | _ => self |> prepare(Load)
  };
};

let dispatch = (command, self): Js.Promise.t(option(string)) => {
  self
  |> prepareCommand(command)
  |> then_(prepared =>
       switch (prepared) {
       | None => resolve(None)
       | Some(cmd) =>
         let s = Command.Packed.serialize(cmd);
         cmd.connection
         |> Connection.send(s)
         |> Util.Promise.map(Option.some);
       }
     );
};

let dispatchUndo = _self => {
  Js.log("Undo");
};
