open Rebase;

module Event = Util.Event;

module Instance = {
  type t = {
    textEditor: Atom.TextEditor.t,
    view: View.Handles.t,
    mutable connection: option(Connection.t),
  };
  let make = (textEditor: Atom.TextEditor.t) => {
    {textEditor, view: View.initialize(textEditor), connection: None};
  };

  let activate = self => {
    self.view.updateActivation^(true);
  };

  let queryConnection = (message, self): Js.Promise.t(string) => {
    activate(self);
    open Util.Promise;
    Js.log("queryConnection");

    self.view.onInquireConnection
    |> Event.on
    |> snd
    |> thenDrop(x => {
         Js.log("!!!!");
         Js.log(x);
       });
    self.view.activateSettingsView |> Event.resolve(true);
    self.view.onSettingsView
    |> Event.once
    |> then_(_ => {
         self.view.navigateSettingsView
         |> Event.resolve(Settings.URI.Connection);
         self.view.inquireConnection |> Event.resolve((message, ""));

         resolve("haha");
       });
    /*
     Js.Promise.
       (
         {
           self.view.activateSettingsView |> Event.send(true);
           resolve("haha");
         }
       ); */
    /* |> then_(()
       => {
         self.view.navigateSettingsView
         |> Event.send(Settings.URI.Connection);
         resolve("haha");
       }) */
    /* |> then_(() => resolve("haha")) */
    /* self.view.inquireConnection |> Event.send((message, "")) */
  };

  /* let connect = (self): Js.Promise.t(Connection.t) => { */
  let connect = self => {
    let getAgdaPath = (): Js.Promise.t(string) => {
      let storedPath =
        Atom.Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
      if (storedPath |> String.isEmpty) {
        Connection.autoSearch("agda");
      } else {
        Js.Promise.resolve(storedPath);
      };
    };
    self |> queryConnection("hey");
    ();
    /*
     Js.Promise.(
       switch (self.connection) {
       | Some(connection) => resolve(connection)
       | None =>
         getAgdaPath()
         |> catch(
              Connection.handleAutoSearchError(
                fun
                | Connection.NotSupported(os) =>
                  queryConnection(
                    {j|Failed to search the path of Agda, as it's currently not supported on $os|j},
                    self,
                  )
                | Connection.NotFound(msg) =>
                  queryConnection(
                    {j|Agda not found!
                 $msg
              |j},
                    self,
                  ),
              ),
            )
         |> then_(x => {
              Js.log("!!!!");
              Js.log(x);
              resolve(x);
            })
         |> then_(Connection.validateAndMake)
         /* |> catch(err => {}) */
         |> then_(Connection.connect)
         |> then_(Connection.wire)
         |> then_(connection => {
              self.connection = Some(connection);
              resolve(connection);
            })
       }
     ); */
  };

  let deactivate = self => {
    self.view.updateActivation^(false);
  };

  let destroy = self => {
    deactivate(self);
    self.view.destroy^();
  };

  /* let modeDisplay = self => {
       self.view.updateMode^(Type.Interaction.Display);
     };

     let modeQuery = self => {
       self.view.updateMode^(Type.Interaction.Query);
     };

     let interceptAndInsertKey = (self, key) => {
       self.view.interceptAndInsertKey^(key);
     };

     let inputMethodHandle = (self, activate) => {
       self.view.activateInputMethod^(activate);
     };

     let updateRawBody = (self, raw) => {
       self.view.updateRawBody^(raw);
     };

     let updateHeader = (self, raw) => {
       self.view.updateHeader^(raw);
     };

     let inquireQuery = (self, placeholder, value) => {
       self.view.inquireQuery^(placeholder, value);
     }; */

  let dispatch = (command, self) => {
    connect(self);
    Js.Promise.resolve(
      "",
      /* Js.Promise.(connect(self) |> then_(Command.dispatch(command))); */
      /* Js.Promise.(connect(self) |> then_(Command.dispatch(command))); */
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
              |> Instance.dispatch(Command.parse(command))
              |> Js.Promise.then_(result =>
                   Js.log(result) |> Js.Promise.resolve
                 )
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
