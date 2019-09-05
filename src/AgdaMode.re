open Rebase;
open Fn;

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
  let filepath =
    textEditor
    |> Atom.TextEditor.getPath
    |> Option.getOr("untitled")
    |> Parser.filepath;
  /* filenames are case insensitive on Windows */
  let onWindows = N.OS.type_() == "Windows_NT";
  if (onWindows) {
    Js.Re.test_([%re "/\\.agda$|\\.lagda$/i"], filepath);
  } else {
    Js.Re.test_([%re "/\\.agda$|\\.lagda$/"], filepath);
  };
};

open Atom;

let subscriptions = CompositeDisposable.make();

/* textEditor active/inactive event */
let onEditorActivationChange = () => {
  let previous = ref(Workspace.getActiveTextEditor());
  Workspace.onDidChangeActiveTextEditor(next => {
    /* decativate the previously activated editor */
    previous^ |> Option.forEach(Instances.getThen(Instance.deactivate));
    /* activate the next editor */
    switch (next) {
    | None => ()
    | Some(nextEditor) =>
      nextEditor |> Instances.getThen(Instance.activate >> ignore);
      previous := Some(nextEditor);
    };
  })
  |> CompositeDisposable.add(subscriptions);
};

/* register keymap bindings and emit commands */
let onTriggerCommand = () => {
  Command.names
  |> Array.forEach(command =>
       Commands.add(
         `CSSSelector("atom-text-editor"), "agda-mode:" ++ command, _event =>
         Workspace.getActiveTextEditor()
         |> Option.flatMap(Instances.get)
         |> Option.forEach(instance =>
              instance
              |> Instance.dispatch(Command.Primitive.parse(command))
              |> Instance.handleCommandError(instance)
              |> ignore
            )
       )
       |> CompositeDisposable.add(subscriptions)
     );
};

/* hijack UNDO */
let onUndo = () => {
  Commands.add(
    `CSSSelector("atom-text-editor"),
    "core:undo",
    event => {
      event |> Webapi.Dom.Event.stopImmediatePropagation;
      let activated = Workspace.getActiveTextEditor();
      activated
      |> Option.flatMap(Instances.get)
      |> Option.forEach(Instance.dispatchUndo);
    },
  )
  |> CompositeDisposable.add(subscriptions);
};

/* the entry point of the whole package */
let activate = _ => {
  /* triggered everytime when a new text editor is opened */
  Workspace.observeTextEditors(textEditor => {
    open CompositeDisposable;
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
  |> CompositeDisposable.add(subscriptions);
  onEditorActivationChange();
  onTriggerCommand();
  onUndo();

  instances;
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
