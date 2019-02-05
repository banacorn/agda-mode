open Rebase;

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

let handleResponse = (response: Response.t, self: Instance.t) => {
  Response.(
    switch (response) {
    | InteractionPoints(indices) =>
      /* destroy all goals */
      self.goals |> Array.forEach(Goal.destroy);
      self.goals = [||];

      let filePath = self.editors.source |> Atom.TextEditor.getPath;
      let source = self.editors.source |> Atom.TextEditor.getText;
      let textBuffer = self.editors.source |> Atom.TextEditor.getBuffer;
      let fileType = Goal.FileType.parse(filePath);
      let result = Goal.Hole.parse(source, indices, fileType);
      self.goals =
        result
        |> Array.map((result: Goal.Hole.result) => {
             let start =
               textBuffer
               |> Atom.TextBuffer.positionForCharacterIndex(
                    fst(result.originalRange),
                  );
             let end_ =
               textBuffer
               |> Atom.TextBuffer.positionForCharacterIndex(
                    snd(result.originalRange),
                  );
             let range = Atom.Range.make(start, end_);
             /* modified the hole */
             self.editors.source
             |> Atom.TextEditor.setTextInBufferRange(range, result.content)
             |> ignore;
             /* make it a goal */
             Goal.make(
               self.editors.source,
               Some(result.index),
               result.modifiedRange,
             );
           });
      ();
    | _ => Js.log(response)
    }
  );
};

/* register keymap bindings and emit commands */
let onTriggerCommand = () => {
  Util.Promise.(
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
                |> thenDrop(
                     Option.forEach(x =>
                       x
                       |> Util.safeSplitByRe([%re "/\\r\\n|\\n/"])
                       |> Array.filterMap(x => x)
                       |> Array.forEach(line =>
                            line
                            |> Js.String.trim
                            |> Emacs.Parser.SExpression.parse
                            |> Result.flatMap(Response.parse)
                            |> Result.forEach(res =>
                                 self |> handleResponse(res)
                               )
                          )
                     ),
                   );
              })
         )
         |> CompositeDisposable.add(subscriptions)
       )
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
