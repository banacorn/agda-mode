open Rebase;
open Atom;
module Event = Util.Event;

open Util.Promise;
type t = {
  editors: Editors.t,
  view: View.Handles.t,
  mutable highlightings: array(Highlighting.t),
  mutable goals: array(Goal.t),
  mutable connection: option(Connection.t),
};
let make = (textEditor: TextEditor.t) => {
  /* adds "agda" to the class-list */
  Environment.Views.getView(textEditor)
  |> Webapi.Dom.HtmlElement.classList
  |> Webapi.Dom.DomTokenList.add("agda");
  /*  */
  let editors = Editors.make(textEditor);
  {
    editors,
    view: View.initialize(editors),
    goals: [||],
    highlightings: [||],
    connection: None,
  };
};

let activate = instance => {
  instance.view.activatePanel |> Event.resolve(true);
};

module Goals = {
  /* destroy all goals */
  let destroyAll = instance => {
    instance.goals |> Array.forEach(Goal.destroy);
    instance.goals = [||];
  };
  /* instantiate all goals */
  let instantiateAll = (indices, instance) => {
    instance |> destroyAll;

    let textEditor = instance.editors.source;
    let filePath = textEditor |> TextEditor.getPath;
    let textBuffer = textEditor |> TextEditor.getBuffer;

    let source = textEditor |> TextEditor.getText;
    let fileType = Goal.FileType.parse(filePath);
    let result = Hole.parse(source, indices, fileType);
    instance.goals =
      result
      |> Array.map((result: Hole.result) => {
           let start =
             textBuffer
             |> TextBuffer.positionForCharacterIndex(
                  fst(result.originalRange),
                );
           let end_ =
             textBuffer
             |> TextBuffer.positionForCharacterIndex(
                  snd(result.originalRange),
                );
           let range = Range.make(start, end_);
           /* modified the hole */
           textEditor
           |> TextEditor.setTextInBufferRange(range, result.content)
           |> ignore;
           /* make it a goal */
           Goal.make(
             instance.editors.source,
             Some(result.index),
             result.modifiedRange,
           );
         });
    ();
  };
};

module Highlightings = {
  /* lots of side effects! */
  let add = (annotation: Highlighting.Annotation.t, instance: t) => {
    let textEditor = instance.editors.source;
    let textBuffer = textEditor |> TextEditor.getBuffer;
    let startPoint =
      textBuffer |> TextBuffer.positionForCharacterIndex(annotation.start - 1);
    let endPoint =
      textBuffer |> TextBuffer.positionForCharacterIndex(annotation.end_ - 1);
    let range = Range.make(startPoint, endPoint);
    let marker = textEditor |> TextEditor.markBufferRange(range);
    /* update the state */
    instance.highlightings |> Js.Array.push(marker) |> ignore;
    /* decorate */
    let types = annotation.types |> Js.Array.joinWith(" ");
    textEditor
    |> TextEditor.decorateMarker(
         marker,
         TextEditor.decorationParams(
           ~type_="highlight",
           ~class_="highlight-decoration " ++ types,
           (),
         ),
       )
    |> ignore;
  };

  let addFromFile = (filepath, instance): Js.Promise.t(unit) => {
    let readFile = N.Fs.readFile |> N.Util.promisify;
    /* read and parse and add */
    readFile(. filepath)
    |> then_(content => {
         open Emacs.Parser.SExpression;
         content
         |> Node.Buffer.toString
         |> Emacs.Parser.SExpression.parse
         |> Result.map(tokens =>
              switch (tokens) {
              | L(xs) =>
                xs |> Highlighting.Annotation.parseIndirectHighlighting
              | _ => [||]
              }
            )
         |> Result.forEach(annotations =>
              annotations
              |> Array.filter(Highlighting.Annotation.shouldHighlight)
              |> Array.forEach(annotation => instance |> add(annotation))
            );
         resolve();
       })
    /* print on error */
    |> catch(err => {
         Js.log(err);
         Js.log("cannot read the indirect highlighting file: " ++ filepath);

         resolve();
       });
  };

  let destroyAll = instance => {
    instance.highlightings |> Array.forEach(DisplayMarker.destroy);
    instance.highlightings = [||];
  };
};

module Connections = {
  let connect = instance => {
    let inquireConnection =
        (error: option(Connection.error), instance): Js.Promise.t(string) => {
      activate(instance);

      let p =
        instance.view.onSettingsView
        |> Event.once
        |> then_(_ => {
             instance.view.navigateSettingsView
             |> Event.resolve(Settings.URI.Connection);

             let promise = instance.view.onInquireConnection |> Event.once;
             instance.view.inquireConnection |> Event.resolve((error, ""));

             promise;
           });

      instance.view.activateSettingsView |> Event.resolve(true);

      p;
    };
    let getAgdaPath = (): Js.Promise.t(string) => {
      let storedPath =
        Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
      if (storedPath |> String.isEmpty) {
        Connection.autoSearch("agda");
      } else {
        Js.Promise.resolve(storedPath);
      };
    };

    let rec getMetadata = (instance, path) => {
      Connection.validateAndMake(path)
      |> catch(
           Connection.handleValidationError(err =>
             instance
             |> inquireConnection(Some(Connection.Validation(path, err)))
             |> then_(getMetadata(instance))
           ),
         );
    };

    let persistConnection = (instance, connection: Connection.t) => {
      instance.connection = Some(connection);
      /* store the path in the config */
      Environment.Config.set("agda-mode.agdaPath", connection.metadata.path);
      /* update the view */
      instance.view.updateConnection |> Event.resolve(Some(connection));
      /* pass it on */
      resolve(connection);
    };

    switch (instance.connection) {
    | Some(connection) => resolve(connection)
    | None =>
      getAgdaPath()
      |> catch(
           Connection.handleAutoSearchError(err =>
             instance |> inquireConnection(Some(Connection.AutoSearch(err)))
           ),
         )
      |> then_(getMetadata(instance))
      |> then_(Connection.connect)
      |> then_(persistConnection(instance))
      |> then_(Connection.wire)
    };
  };

  let disconnect = instance => {
    switch (instance.connection) {
    | Some(connection) =>
      Connection.disconnect(connection);
      instance.connection = None;
    | None => ()
    };
  };

  let get = instance => {
    switch (instance.connection) {
    | Some(connection) => resolve(connection)
    | None => connect(instance)
    };
  };
};
let deactivate = instance => {
  instance.view.activatePanel |> Event.resolve(false);
};

let destroy = instance => {
  deactivate(instance);
  instance.view.destroy^();
};

let prepareCommand =
    (command: Command.Bare.t, instance)
    : Js.Promise.t(option(Command.Packed.t)) => {
  let prepare = (command, instance) => {
    Connections.get(instance)
    |> then_(connection =>
         Some(
           {
             connection,
             filepath: instance.editors.source |> TextEditor.getPath,
             command,
           }: Command.Packed.t,
         )
         |> resolve
       );
  };
  switch (command) {
  | Load =>
    /* force save before load */
    instance.editors.source
    |> TextEditor.save
    |> Util.Promise.then_(() => instance |> prepare(Load))
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;

    resolve(None);
  | Restart =>
    Connections.disconnect(instance);
    instance |> prepare(Load);
  | InputSymbol(symbol) =>
    let enabled = Environment.Config.get("agda-mode.inputMethod");
    if (enabled) {
      switch (symbol) {
      | Ordinary =>
        instance.view.activatePanel |> Event.resolve(true);
        instance.view.activateInputMethod |> Event.resolve(true);
      | CurlyBracket =>
        instance.view.interceptAndInsertKey |> Event.resolve("{")
      | Bracket => instance.view.interceptAndInsertKey |> Event.resolve("[")
      | Parenthesis =>
        instance.view.interceptAndInsertKey |> Event.resolve("(")
      | DoubleQuote =>
        instance.view.interceptAndInsertKey |> Event.resolve("\"")
      | SingleQuote =>
        instance.view.interceptAndInsertKey |> Event.resolve("'")
      | BackQuote => instance.view.interceptAndInsertKey |> Event.resolve("`")
      };
      ();
    } else {
      instance.editors
      |> Editors.Focus.get
      |> TextEditor.insertText("\\")
      |> ignore;
    };
    resolve(None);
  | _ => instance |> prepare(Load)
  };
};

let dispatch = (command, instance): Js.Promise.t(option(string)) => {
  instance
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

let dispatchUndo = _instance => {
  Js.log("Undo");
};
