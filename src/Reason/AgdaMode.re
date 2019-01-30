open Rebase;

module Event = Util.Event;

module Instance = {
  open Util.Promise;
  type t = {
    editors: Editors.t,
    view: View.Handles.t,
    mutable connection: option(Connection.t),
  };
  let make = (textEditor: Atom.TextEditor.t) => {
    let editors = Editors.make(textEditor);
    {editors, view: View.initialize(editors), connection: None};
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
      (command: Command.Bare.t, self)
      : Js.Promise.t(option(Command.Packed.t)) => {
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
        | CurlyBracket =>
          self.view.interceptAndInsertKey |> Event.resolve("{")
        | Bracket => self.view.interceptAndInsertKey |> Event.resolve("[")
        | Parenthesis => self.view.interceptAndInsertKey |> Event.resolve("(")
        | DoubleQuote =>
          self.view.interceptAndInsertKey |> Event.resolve("\"")
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
};

let instances: Js.Dict.t(Instance.t) = Js.Dict.empty();

module Instances = {
  let get = textEditor => {
    let id = textEditor |> Atom.TextEditor.id |> string_of_int;
    Js.Dict.get(instances, id);
  };
  let getThen = (f, textEditor) => textEditor |> get |> Option.forEach(f);

  let add = textEditor => {
    let id = textEditor |> Atom.TextEditor.id |> string_of_int;
    switch (get(textEditor)) {
    | Some(_instance) => ()
    | None => Instance.make(textEditor) |> Js.Dict.set(instances, id)
    };
  };
  let remove = textEditor => {
    let id = textEditor |> Atom.TextEditor.id |> string_of_int;
    switch (Js.Dict.get(instances, id)) {
    | Some(instance) =>
      Instance.destroy(instance);
      %raw
      "delete instances[id]";
    | None => ()
    };
  };
  let contains = textEditor => {
    switch (get(textEditor)) {
    | Some(_instance) => true
    | None => false
    };
  };
};

/* if end with '.agda' or '.lagda' */
let isAgdaFile = (textEditor): bool => {
  let filepath = textEditor |> Atom.TextEditor.getPath;
  /* filenames are case insensitive on Windows */
  let onWindows = Connection.OS.type_() == "Windows_NT";
  if (onWindows) {
    Js.Re.test(filepath, [%re "/\\.agda$|\\.lagda$/i"]);
  } else {
    Js.Re.test(filepath, [%re "/\\.agda$|\\.lagda$/"]);
  };
};

open Atom;

let subscriptions = CompositeDisposable.make();

/* textEditor active/inactive event */
let onEditorActivationChange = () => {
  let previous = ref(Environment.Workspace.getActiveTextEditor());
  Environment.Workspace.onDidChangeActiveTextEditor(next => {
    /* decativate the previously activated editor */
    previous^ |> Option.forEach(Instances.getThen(Instance.deactivate));
    /* activate the next editor */
    switch (next) {
    | None => ()
    | Some(nextEditor) =>
      nextEditor |> Instances.getThen(Instance.activate);
      previous := Some(nextEditor);
    };
  })
  |> CompositeDisposable.add(subscriptions);
};

/* register keymap bindings and emit commands */
let onTriggerCommand = () => {
  Command.names
  |> Array.forEach(command =>
       Environment.Commands.add(
         `CSSSelector("atom-text-editor"), "agda-mode:" ++ command, _event =>
         Environment.Workspace.getActiveTextEditor()
         |> Option.flatMap(Instances.get)
         |> Option.forEach(self => {
              Js.log("triggering: " ++ command);
              self
              |> Instance.dispatch(Command.Bare.parse(command))
              |> Js.Promise.then_(result =>
                   result
                   |> Option.forEach(x =>
                        x
                        |> Js.String.split("\n")
                        |> Array.map(x => Js.String.trim(x))
                        |> Array.map(Emacs.Parser.SExpression.parse)
                        |> Js.log
                      )
                   |> Js.Promise.resolve
                 )
              /* Js.log(result) |> Js.Promise.resolve; */
              |> ignore;
            })
       )
       |> CompositeDisposable.add(subscriptions)
     );
};

/* hijack UNDO */
let onUndo = () => {
  Environment.Commands.add(
    `CSSSelector("atom-text-editor"),
    "core:undo",
    event => {
      event |> Webapi.Dom.Event.stopImmediatePropagation;
      let activated = Environment.Workspace.getActiveTextEditor();
      activated |> Option.forEach(Instance.dispatchUndo);
    },
  )
  |> CompositeDisposable.add(subscriptions);
};

/* the entry point of the whole package */
let activate = _ => {
  CompositeDisposable.
    /* triggered everytime when a new text editor is opened */
    (
      Environment.Workspace.observeTextEditors(textEditor => {
        let textEditorSubscriptions = make();

        /* register it */
        if (isAgdaFile(textEditor)) {
          Instances.add(textEditor);
        };

        /* subscribe to path change in case that `isAgdaFile(textEditor)` changed */
        textEditor
        |> TextEditor.onDidChangePath(() => {
             /* agda => not agda */
             if (!isAgdaFile(textEditor) && Instances.contains(textEditor)) {
               Instances.remove(textEditor);
             };
             /* not agda => agda */
             if (isAgdaFile(textEditor) && !Instances.contains(textEditor)) {
               Instances.add(textEditor);
             };
           })
        |> add(textEditorSubscriptions);

        /* on destroy */
        textEditor
        |> TextEditor.onDidDestroy(() => {
             if (isAgdaFile(textEditor) && Instances.contains(textEditor)) {
               Instances.remove(textEditor);
             };
             dispose(textEditorSubscriptions);
           })
        |> add(textEditorSubscriptions);
      })
      |> add(subscriptions)
    );
  onEditorActivationChange();
  onTriggerCommand();
  onUndo();
};
let deactivate = _ => {
  CompositeDisposable.dispose(subscriptions);
};

/* https://atom.io/docs/api/latest/Config */
let config = {
  "agdaPath": {
    "title": "Agda",
    "description": "Path to the executable of Agda, automatically inferred when possible. Overwrite to override.",
    "type": "string",
    "default": "",
    "order": 1,
  },
  "enableJSONProtocol": {
    "title": "Enable the JSON protocol (experimental)",
    "description": "Demand Agda to output in JSON format when possible",
    "type": "boolean",
    "default": false,
    "order": 2,
  },
  "libraryPath": {
    "title": "Libraries",
    "description": "Paths to include (such as agda-stdlib), seperate with comma. Useless after Agda 2.5.0",
    "type": "array",
    "default": ([||]: array(string)),
    "items": {
      "type": "string",
    },
    "order": 5,
  },
  "backend": {
    "title": "Backend",
    "description": "The backend which is used to compile Agda programs.",
    "type": "string",
    "default": "GHCNoMain",
    "enum": [|"GHC", "GHCNoMain"|],
    "order": 10,
  },
  "highlightingMethod": {
    "title": "Highlighting information passing",
    "description": "Receive parsed result from Agda, directly from stdio, or indirectly from temporary files (which requires frequent disk access)",
    "type": "string",
    "default": "Direct",
    "enum": [|"Indirect", "Direct"|],
    "order": 20,
  },
  "maxBodyHeight": {
    "title": "Max panel size",
    "description": "The max height the panel could strech",
    "type": "integer",
    "default": 170,
    "minimum": 40,
    "maximum": 1010,
    "order": 30,
  },
  "inputMethod": {
    "title": "Input Method",
    "description": "Enable input method",
    "type": "boolean",
    "default": true,
    "order": 40,
  },
  "trimSpaces": {
    "title": "Trim spaces",
    "description": "Remove leading and trailing spaces of an expression in an hole, when giving it to Agda. (Default to be False in Emacs, but True in here)",
    "type": "boolean",
    "default": true,
    "order": 50,
  },
};
