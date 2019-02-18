open Rebase;
open Async;
module Event = Event;

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
  let find = (index, instance) => instance.goals[index];

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

  let addFromFile = (filepath, instance): Async.t(unit, unit) => {
    let readFile = N.Fs.readFile |> N.Util.promisify;
    /* read and parse and add */
    readFile(. filepath)
    |> fromPromise
    |> thenOk(content => {
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
    |> mapError(err => {
         Js.log(err);
         Js.log("cannot read the indirect highlighting file: " ++ filepath);
       });
  };

  let destroyAll = instance => {
    instance.highlightings |> Array.forEach(DisplayMarker.destroy);
    instance.highlightings = [||];
  };
};

module Connections = {
  open Atom;
  let connect = (instance: t): Async.t(Connection.t, MiniEditor.error) => {
    let inquireConnection =
        (error: option(Connection.error), instance)
        : Async.t(string, MiniEditor.error) => {
      activate(instance);

      /* listen to `onSettingsView` before triggering `activateSettingsView` */
      let promise: Async.t(string, MiniEditor.error) =
        instance.view.onSettingsView
        |> Event.once
        |> mapError(_ => MiniEditor.Cancelled)
        |> thenOk(_ => {
             instance.view.navigateSettingsView
             |> Event.resolve(Settings.URI.Connection);
             /* listen to `onInquireConnection` before triggering `inquireConnection` */
             let promise: Async.t(string, MiniEditor.error) =
               instance.view.onInquireConnection |> Event.once;
             instance.view.inquireConnection |> Event.resolve((error, ""));

             promise;
           });
      instance.view.activateSettingsView |> Event.resolve(true);

      promise;
    };

    let getAgdaPath = (): Async.t(string, Connection.autoSearchError) => {
      let storedPath =
        Environment.Config.get("agda-mode.agdaPath") |> Parser.filepath;
      if (storedPath |> String.isEmpty) {
        Connection.autoSearch("agda");
      } else {
        resolve(storedPath);
      };
    };

    /* validate the given path */
    let rec getMetadata =
            (instance, path): Async.t(Connection.metadata, MiniEditor.error) => {
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
            (instance, metadata): Async.t(Connection.t, MiniEditor.error) => {
      Connection.connect(metadata)
      |> thenError(err =>
           instance
           |> inquireConnection(Some(Connection.Connection(err)))
           |> thenOk(getMetadata(instance))
           |> thenOk(getConnection(instance))
         );
    };

    switch (instance.connection) {
    | Some(connection) => resolve(connection)
    | None =>
      getAgdaPath()
      |> thenError(err =>
           instance |> inquireConnection(Some(Connection.AutoSearch(err)))
         )
      |> thenOk(getMetadata(instance))
      |> thenOk(getConnection(instance))
      |> mapOk(persistConnection(instance))
      |> mapOk(Connection.wire)
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
  instance.view.destroy |> Event.resolve();
};

let inquire =
    (placeholder, value, instance): Async.t(string, MiniEditor.error) => {
  activate(instance);

  let promise = instance.view.onInquireQuery |> Event.once;
  instance.view.inquireQuery |> Event.resolve((placeholder, value));

  promise;
};

/* Primitive Command => Remote Command */
let handleLocalCommand =
    (command: Command.Primitive.t, instance)
    : Async.t(option(Command.Remote.t), Command.error) => {
  let buff = (command, instance) => {
    Connections.get(instance)
    |> mapOk(connection =>
         Some(
           {
             connection,
             filepath: instance.editors.source |> Atom.TextEditor.getPath,
             command,
           }: Command.Remote.t,
         )
       )
    |> mapError(_ => Command.Cancelled);
  };
  switch (command) {
  | Load =>
    /* force save before load */
    instance.editors.source
    |> Atom.TextEditor.save
    |> fromPromise
    |> mapError(_ => Command.Cancelled)
    |> thenOk(() => instance |> buff(Load))
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;
    resolve(None);
  | Restart =>
    Connections.disconnect(instance);
    instance |> buff(Load);
  | Give =>
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      switch (goal.index) {
      | Some(index) =>
        if (Goal.isEmpty(goal)) {
          instance
          |> inquire("expression to give:", "")
          |> mapError(_ => Command.Cancelled)
          |> thenOk(result => {
               goal |> Goal.setContent(result) |> ignore;
               instance |> buff(Give(goal, index));
             });
        } else {
          instance |> buff(Give(goal, index));
        }
      | None =>
        /* instance
           |> updateView(
                {text: "Goal not indexed", style: Header.Error},
                Emacs(PlainText("Please reload to re-index the goal")),
              ); */
        reject(Command.GoalNotIndexed)
      }
    | None =>
      /* instance
         |> updateView(
              {text: "Out of goal", style: Header.Error},
              Emacs(
                PlainText(
                  "`Give` is a goal-specific command, please place the cursor in a goal",
                ),
              ),
            ); */
      reject(Command.OutOfGoal)
    };
  | Refine =>
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      switch (goal.index) {
      | Some(index) => instance |> buff(Refine(goal, index))
      | None => reject(Command.GoalNotIndexed)
      }
    | None => reject(Command.OutOfGoal)
    };
  | Auto =>
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      switch (goal.index) {
      | Some(index) => instance |> buff(Auto(goal, index))
      | None => reject(Command.GoalNotIndexed)
      }
    | None => reject(Command.OutOfGoal)
    };
  | Case =>
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      switch (goal.index) {
      | Some(index) =>
        if (Goal.isEmpty(goal)) {
          instance
          |> inquire("expression to case:", "")
          |> mapError(_ => Command.Cancelled)
          |> thenOk(result => {
               goal |> Goal.setContent(result) |> ignore;
               instance |> buff(Case(goal, index));
             });
        } else {
          instance |> buff(Case(goal, index));
        }
      | None => reject(Command.GoalNotIndexed)
      }
    | None => reject(Command.OutOfGoal)
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
    resolve(None);
  | _ => instance |> buff(Load)
  };
};

let handleResponseInfo =
    (info: Response.Info.t, instance: t): Async.t(unit, Command.error) => {
  /* open Response.Info; */

  open Type.View;

  let updateView = (header, body) => {
    instance.view.updateHeader |> Event.resolve(header);
    instance.view.updateBody |> Event.resolve(body);
    resolve();
  };
  switch (info) {
  | CompilationOk =>
    updateView({text: "Compilation Done!", style: Header.Success}, Nothing)
  | Constraints(None) =>
    updateView({text: "No Constraints", style: Header.Success}, Nothing)
  | Constraints(Some(payload)) =>
    updateView(
      {text: "Constraints", style: Header.Info},
      Emacs(Constraints(payload)),
    )
  | AllGoalsWarnings(payload) =>
    updateView(
      {text: payload.title, style: Header.Info},
      Emacs(AllGoalsWarnings(payload)),
    )
  | Time(payload) =>
    updateView(
      {text: "Time", style: Header.PlainText},
      Emacs(PlainText(payload)),
    )
  | Error(payload) =>
    updateView({text: "Error", style: Header.Error}, Emacs(Error(payload)))
  | Intro(payload) =>
    updateView(
      {text: "Intro", style: Header.PlainText},
      Emacs(PlainText(payload)),
    )
  | Auto(payload) =>
    updateView(
      {text: "Auto", style: Header.PlainText},
      Emacs(PlainText(payload)),
    )
  | ModuleContents(payload) =>
    updateView(
      {text: "Module Contents", style: Header.Info},
      Emacs(PlainText(payload)),
    )
  | SearchAbout(payload) =>
    updateView(
      {text: "Searching about ...", style: Header.PlainText},
      Emacs(SearchAbout(payload)),
    )
  | WhyInScope(payload) =>
    updateView(
      {text: "Scope info", style: Header.Info},
      Emacs(WhyInScope(payload)),
    )
  | NormalForm(payload) =>
    updateView(
      {text: "Normal form", style: Header.Info},
      Emacs(PlainText(payload)),
    )
  | GoalType(payload) =>
    updateView(
      {text: "Goal type", style: Header.Info},
      Emacs(GoalTypeContext(payload)),
    )
  | CurrentGoal(payload) =>
    updateView(
      {text: "Current goal", style: Header.Info},
      Emacs(PlainText(payload)),
    )
  | InferredType(payload) =>
    updateView(
      {text: "Inferred type", style: Header.Info},
      Emacs(PlainText(payload)),
    )
  | Context(payload) =>
    updateView(
      {text: "Context", style: Header.Info},
      Emacs(Context(payload)),
    )
  | HelperFunction(payload) =>
    updateView(
      {text: "Helper function", style: Header.Info},
      Emacs(PlainText(payload)),
    )
  | Version(payload) =>
    updateView(
      {text: "Version", style: Header.Info},
      Emacs(PlainText(payload)),
    )
  };
};

let handleResponse =
    (instance: t, response: Response.t): Async.t(unit, Command.error) => {
  let textEditor = instance.editors.source;
  let filePath = textEditor |> Atom.TextEditor.getPath;
  let textBuffer = textEditor |> Atom.TextEditor.getBuffer;
  let updateView = (header, body) => {
    instance.view.updateHeader |> Event.resolve(header);
    instance.view.updateBody |> Event.resolve(body);
  };
  switch (response) {
  | HighlightingInfoDirect(_remove, annotations) =>
    annotations
    |> Array.filter(Highlighting.Annotation.shouldHighlight)
    |> Array.forEach(annotation => instance |> Highlightings.add(annotation));
    resolve();
  | HighlightingInfoIndirect(filepath) =>
    instance
    |> Highlightings.addFromFile(filepath)
    |> mapOk(() => N.Fs.unlink(filepath, _ => ()))
    |> mapError(_ => Command.Cancelled)
  | Status(displayImplicit, checked) =>
    if (displayImplicit || checked) {
      updateView(
        {text: "Status", style: Type.View.Header.PlainText},
        Emacs(
          PlainText(
            "Typechecked: "
            ++ string_of_bool(checked)
            ++ "\nDisplay implicit arguments: "
            ++ string_of_bool(displayImplicit),
          ),
        ),
      );
    };
    resolve();
  | JumpToError(targetFilePath, index) =>
    if (targetFilePath == filePath) {
      let point =
        textBuffer |> Atom.TextBuffer.positionForCharacterIndex(index - 1);
      textEditor |> Atom.TextEditor.setCursorBufferPosition(point);
    };
    resolve();
  | InteractionPoints(indices) =>
    instance |> Goals.instantiateAll(indices);
    resolve();
  | GiveAction(index, give) =>
    switch (Goals.find(index, instance)) {
    | None => resolve()
    | Some(goal) =>
      switch (give) {
      | Paren =>
        let content = Goal.getContent(goal);
        Goal.setContent("(" ++ content ++ ")", goal) |> ignore;
      | NoParen => () /* do nothing */
      | String(content) =>
        Goal.setContent(
          content |> Js.String.replaceByRe([%re "/\\\\n/g"], "\n"),
          goal,
        )
        |> ignore
      };
      Goal.removeBoundary(goal);
      Goal.destroy(goal);
      resolve();
    }
  | MakeCase(makeCaseType, lines) =>
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      switch (makeCaseType) {
      | Function => Goal.writeLines(lines, goal)
      | ExtendedLambda => Goal.writeLambda(lines, goal)
      };
      resolve();
    /* instance |> Instance.dispatch(Load); */
    | None => reject(Command.OutOfGoal)
    };
  | DisplayInfo(info) =>
    instance.view.activatePanel |> Event.resolve(true);
    handleResponseInfo(info, instance);
  | ClearHighlighting =>
    instance |> Highlightings.destroyAll;
    resolve();
  | _ =>
    Js.log(response);
    resolve();
  };
};

let dispatch = (command, instance): Async.t(int, Command.error) => {
  instance
  |> handleLocalCommand(command)
  |> thenOk(remote =>
       switch (remote) {
       | None => resolve(0)
       | Some(cmd) =>
         let serialized = Command.Remote.serialize(cmd);
         /* send the serialized command */
         cmd.connection
         |> Connection.send(serialized)
         |> mapOk(Emacs.Parser.SExpression.parseFile)
         |> mapOk(
              Array.map(tokens =>
                tokens
                |> Result.flatMap(Response.parse)
                |> Result.map(handleResponse(instance))
              ),
            )
         |> mapError(_ => Command.Cancelled)
         |> ignore;
         resolve(0);
       }
     );
};

let dispatchUndo = _instance => {
  Js.log("Undo");
};
