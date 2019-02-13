open Rebase;
open Util.Promise;
module Event = Util.Event;

type t = {
  editors: Editors.t,
  view: View.Handles.t,
  mutable highlightings: array(Highlighting.t),
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
  {
    editors,
    view: View.initialize(editors),
    goals: [||],
    highlightings: [||],
    connection: None,
  };
};

let updateView = (header, body, instance) => {
  instance.view.updateHeader |> Event.resolve(header);
  instance.view.updateBody |> Event.resolve(body);
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
    open Atom;

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
  open Atom;
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
  open Atom;
  let connect =
      (instance: t): Util.Promise.t(result(Connection.t, MiniEditor.error)) => {
    let inquireConnection =
        (error: option(Connection.error), instance)
        : Js.Promise.t(result(string, MiniEditor.error)) => {
      activate(instance);

      /* listen to `onSettingsView` before triggering `activateSettingsView` */
      let promise =
        instance.view.onSettingsView
        |> Event.once
        |> then_(_ => {
             instance.view.navigateSettingsView
             |> Event.resolve(Settings.URI.Connection);
             /* listen to `onInquireConnection` before triggering `inquireConnection` */
             let promise = instance.view.onInquireConnection |> Event.once;
             instance.view.inquireConnection |> Event.resolve((error, ""));

             promise;
           });
      instance.view.activateSettingsView |> Event.resolve(true);

      promise;
    };

    let getAgdaPath =
        (): Js.Promise.t(result(string, Connection.autoSearchError)) => {
      let storedPath =
        Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
      if (storedPath |> String.isEmpty) {
        Connection.autoSearch("agda");
      } else {
        resolve(Ok(storedPath));
      };
    };

    /* validate the given path */
    let rec getMetadata =
            (instance, path)
            : Util.Promise.t(result(Connection.metadata, MiniEditor.error)) => {
      Connection.validateAndMake(path)
      |> thenError(err =>
           instance
           |> inquireConnection(Some(Connection.Validation(path, err)))
           |> thenOk(getMetadata(instance))
         );
    };

    let persistConnection = (instance, connection: Connection.t) => {
      instance.connection = Some(connection);
      /* store the path in the config */
      Environment.Config.set("agda-mode.agdaPath", connection.metadata.path);
      /* update the view */
      instance.view.updateConnection |> Event.resolve(Some(connection));
      /* pass it on */
      connection;
    };

    let rec getConnection =
            (instance, metadata)
            : Util.Promise.t(result(Connection.t, MiniEditor.error)) => {
      Connection.connect(metadata)
      |> thenError(err =>
           instance
           |> inquireConnection(Some(Connection.Connection(err)))
           |> thenOk(getMetadata(instance))
           |> thenOk(getConnection(instance))
         );
    };

    switch (instance.connection) {
    | Some(connection) => resolve(Ok(connection))
    | None =>
      getAgdaPath()
      |> thenError(err =>
           instance |> inquireConnection(Some(Connection.AutoSearch(err)))
         )
      |> thenOk(getMetadata(instance))
      |> thenOk(getConnection(instance))
      |> mapOk(persistConnection(instance))
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
    | Some(connection) => resolve(Ok(connection))
    | None => connect(instance)
    };
  };
};
let deactivate = instance => {
  instance.view.activatePanel |> Event.resolve(false);
};

let destroy = instance => {
  deactivate(instance);
  instance.view.destroy |> Event.resolve();
};

let inquire =
    (placeholder, value, instance)
    : Js.Promise.t(result(string, MiniEditor.error)) => {
  activate(instance);

  let promise = instance.view.onInquireQuery |> Event.once;
  instance.view.inquireQuery |> Event.resolve((placeholder, value));

  promise;
};

/* Primitive Command => Cultivated Command */
let cultivateCommand =
    (command: Command.Primitive.t, instance)
    : Js.Promise.t(result(option(Command.Cultivated.t), Command.error)) => {
  let cultivate = (command, instance) => {
    Connections.get(instance)
    |> mapOk(connection =>
         Some(
           {
             connection,
             filepath: instance.editors.source |> Atom.TextEditor.getPath,
             command,
           }: Command.Cultivated.t,
         )
       )
    |> mapError(_ => Command.Cancelled);
  };
  switch (command) {
  | Load =>
    /* force save before load */
    instance.editors.source
    |> Atom.TextEditor.save
    |> then_(() => instance |> cultivate(Load))
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;
    resolve(Ok(None));
  | Restart =>
    Connections.disconnect(instance);
    instance |> cultivate(Load);
  | Give =>
    open Type.View;
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      if (Goal.isEmpty(goal)) {
        instance
        |> inquire("expression to give:", "")
        |> mapError(_ => Command.Cancelled)
        |> thenOk(result => {
             goal |> Goal.setContent(result) |> ignore;
             instance |> cultivate(Give(goal));
           });
      } else {
        instance |> cultivate(Give(goal));
      }
    | None =>
      instance
      |> updateView(
           {text: "Out of goal", style: Header.Error},
           Emacs(
             PlainText(
               "`Give` is a goal-specific command, please place the cursor in a goal",
             ),
           ),
         );
      resolve(Error(Command.OutOfGoal));
    };
  | InputSymbol(symbol) =>
    let enabled = Atom.Environment.Config.get("agda-mode.inputMethod");
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
      |> Atom.TextEditor.insertText("\\")
      |> ignore;
    };
    resolve(Ok(None));
  | _ => instance |> cultivate(Load)
  };
};

let dispatch = (command, instance): Js.Promise.t(option(string)) => {
  instance
  |> cultivateCommand(command)
  |> then_(cultivated =>
       switch (cultivated) {
       | Error(_) => resolve(None)
       | Ok(None) => resolve(None)
       | Ok(Some(cmd)) =>
         let s = Command.Cultivated.serialize(cmd);
         cmd.connection |> Connection.send(s) |> map(Option.some);
       }
     );
};

let dispatchUndo = _instance => {
  Js.log("Undo");
};
