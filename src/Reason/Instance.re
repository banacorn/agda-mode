open Rebase;
open Async;
module Event = Event;

type t = {
  mutable loaded: bool,
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
    loaded: false,
    editors,
    view: View.initialize(editors),
    goals: [||],
    highlightings: [||],
    connection: None,
  };
};

let activate = instance => {
  instance.view.activatePanel |> Event.emitOk(true);
};

let deactivate = instance => {
  instance.view.activatePanel |> Event.emitOk(false);
};

let destroy = instance => {
  deactivate(instance);
  instance.view.destroy |> Event.emitOk();
};

module Goals = {
  /* destroy all goals */
  let destroyAll = instance => {
    instance.goals |> Array.forEach(Goal.destroy);
    instance.goals = [||];
  };
  let find = (index: int, instance) => {
    let found =
      instance.goals
      |> Array.filter(goal =>
           switch (goal.Goal.index) {
           | None => false
           | Some(i) => i == index
           }
         );
    found[0];
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
             |> Event.emitOk(Settings.URI.Connection);
             /* listen to `onInquireConnection` before triggering `inquireConnection` */
             let promise: Async.t(string, MiniEditor.error) =
               instance.view.onInquireConnection |> Event.once;
             instance.view.inquireConnection |> Event.emitOk((error, ""));

             promise;
           });
      instance.view.activateSettingsView |> Event.emitOk(true);

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
            (instance, pathAndParams)
            : Async.t(Connection.metadata, MiniEditor.error) => {
      let (path, args) = Parser.commandLine(pathAndParams);
      Connection.validateAndMake(path, args)
      |> thenError(err =>
           instance
           |> inquireConnection(
                Some(Connection.Validation(pathAndParams, err)),
              )
           |> thenOk(getMetadata(instance))
         );
    };

    let persistConnection = (instance, connection: Connection.t) => {
      instance.connection = Some(connection);
      /* store the path in the config */
      let path =
        Array.concat(connection.metadata.args, [|connection.metadata.path|])
        |> List.fromArray
        |> String.joinWith(" ");
      Environment.Config.set("agda-mode.agdaPath", path);
      /* update the view */
      instance.view.updateConnection |> Event.emitOk(Some(connection));
      /* pass it on */
      connection;
    };

    let rec getConnection =
            (instance, metadata): Async.t(Connection.t, MiniEditor.error) => {
      Connection.connect(metadata)
      |> thenError(err => {
           Js.log(err);
           instance
           |> inquireConnection(Some(Connection.Connection(err)))
           |> thenOk(getMetadata(instance))
           |> thenOk(getConnection(instance));
         });
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
      Connection.disconnect(Connection.DisconnectedByUser, connection);
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

module Views = {
  let display = (text, style, body, handles) => {
    open View.Handles;
    open Type.View.Header;
    handles.display |> Event.emitOk(({text, style}, body));
    Async.resolve();
  };

  let inquire =
      (text, placeholder, value, handles): Async.t(string, Command.error) => {
    open View.Handles;
    open Type.View.Header;

    let promise = handles.onInquireQuery |> Event.once;
    handles.inquire
    |> Event.emitOk(({text, style: PlainText}, placeholder, value));

    promise |> mapError(_ => Command.Cancelled);
  };

  let toggleDocking = (handles): Async.t(unit, unit) => {
    View.Handles.(handles.toggleDocking |> Event.emitOk());
    Async.resolve();
  };
};

let getPointedGoal = (instance): Async.t(Goal.t, Command.error) => {
  let pointed = Editors.pointingAt(instance.goals, instance.editors);
  switch (pointed) {
  | Some(goal) => resolve(goal)
  | None => reject(Command.OutOfGoal)
  };
};

let getPointedGoalAt = (cursor, instance): Async.t(Goal.t, Command.error) => {
  let pointed = Editors.pointingAt(~cursor, instance.goals, instance.editors);
  switch (pointed) {
  | Some(goal) => resolve(goal)
  | None => reject(Command.OutOfGoal)
  };
};

let handleOutOfGoal = callback =>
  thenError(error =>
    switch (error) {
    | Command.OutOfGoal => callback()
    | _ => reject(error)
    }
  );

let getGoalIndex = (goal: Goal.t): Async.t((Goal.t, int), Command.error) => {
  switch (goal.index) {
  | Some(index) => resolve((goal, index))
  | None => reject(Command.GoalNotIndexed)
  };
};

/* shift cursor if in certain goal */
let recoverCursor = (callback, instance) => {
  let cursor =
    instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
  let result = callback();

  instance
  |> getPointedGoalAt(cursor)
  /* reposition the cursor in the goal only if it's a fresh hole (coming from '?') */
  |> thenOk(goal => {
       let fresh = Goal.isEmpty(goal);
       if (fresh) {
         let delta = Atom.Point.make(0, 3);
         let newPosition =
           Atom.Point.translate(delta, goal.range |> Atom.Range.start);
         Js.Global.setTimeout(
           () =>
             instance.editors.source
             |> Atom.TextEditor.setCursorBufferPosition(newPosition),
           0,
         )
         |> ignore;
         resolve();
       } else {
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(cursor);
         resolve();
       };
     })
  |> handleOutOfGoal(_ => {
       instance.editors.source
       |> Atom.TextEditor.setCursorBufferPosition(cursor);
       resolve();
     })
  |> ignore;

  /* return the result of the callbak */
  result;
};

let handleCommandError = instance =>
  thenError((error: Command.error) => {
    Command.
      /*  */
      (
        switch (error) {
        | Connection(_connErr) =>
          instance.view
          |> Views.display(
               "Connection-related Error",
               Type.View.Header.Error,
               Emacs(PlainText("")),
             )
        | Cancelled =>
          instance.view
          |> Views.display(
               "Query Cancelled",
               Type.View.Header.Error,
               Emacs(PlainText("")),
             )
        | GoalNotIndexed =>
          instance.view
          |> Views.display(
               "Goal not indexed",
               Type.View.Header.Error,
               Emacs(PlainText("Please reload to re-index the goal")),
             )
        | OutOfGoal =>
          instance.view
          |> Views.display(
               "Out of goal",
               Type.View.Header.Error,
               Emacs(PlainText("Please place the cursor in a goal")),
             )
        }
      )
    |> ignore;
    resolve();
  });

let getSelectedTextNode = instance => {
  let getSelectedText = () => {
    instance.editors.source |> Atom.TextEditor.getSelectedText;
  };
  let getLargerSyntaxNode = () => {
    instance.editors.source |> Atom.TextEditor.selectLargerSyntaxNode;
    instance.editors.source |> Atom.TextEditor.getSelectedText;
  };
  let getPointedWord = () => {
    instance.editors.source |> Atom.TextEditor.selectWordsContainingCursors;
    instance.editors.source |> Atom.TextEditor.getSelectedText;
  };

  let selectedText = getSelectedText();

  /* if the user didn't select anything */
  if (String.isEmpty(selectedText)) {
    let largerNode = getLargerSyntaxNode();
    /* this happens when language-agda is not installed */
    if (String.isEmpty(largerNode)) {
      getPointedWord();
    } else {
      let pointedText = getPointedWord();
      /* this happens when the user is hovering on a mixfix/infix operator like _+_ */
      if (pointedText == "_") {
        getLargerSyntaxNode();
      } else {
        pointedText;
      };
    };
  } else {
    selectedText;
  };
};

/* Primitive Command => Remote Command */
let rec handleLocalCommand =
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
    |> thenOk(() => {
         instance.loaded = true;
         instance |> buff(Load);
       })
  | Abort => instance |> buff(Abort)
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;
    instance.loaded = false;
    resolve(None);
  | Restart =>
    Connections.disconnect(instance);
    instance |> buff(Load);
  | Compile => instance |> buff(Compile)
  | ToggleDisplayOfImplicitArguments =>
    instance |> buff(ToggleDisplayOfImplicitArguments)
  | SolveConstraints => instance |> buff(SolveConstraints)
  | ShowConstraints => instance |> buff(ShowConstraints)
  | ShowGoals => instance |> buff(ShowGoals)
  | NextGoal =>
    let nextGoal = ref(None);
    let cursor =
      instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
    let positions =
      instance.goals
      |> Array.map(goal =>
           Atom.Point.translate(
             Atom.Point.make(0, 3),
             Atom.Range.start(goal.Goal.range),
           )
         );
    /* assign the next goal position */
    positions
    |> Array.forEach(position =>
         if (Atom.Point.isGreaterThan(cursor, position) && nextGoal^ === None) {
           nextGoal := Some(position);
         }
       );

    /* if no goal ahead of cursor, then loop back */
    if (nextGoal^ === None) {
      nextGoal := positions[0];
    };

    /* jump */
    nextGoal^
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);
  | PreviousGoal =>
    let previousGoal = ref(None);
    let cursor =
      instance.editors.source |> Atom.TextEditor.getCursorBufferPosition;
    let positions =
      instance.goals
      |> Array.map(goal =>
           Atom.Point.translate(
             Atom.Point.make(0, 3),
             Atom.Range.start(goal.Goal.range),
           )
         );

    /* assign the previous goal position */
    positions
    |> Array.forEach(position =>
         if (Atom.Point.isLessThan(cursor, position) && previousGoal^ === None) {
           previousGoal := Some(position);
         }
       );

    /* loop back if this is already the first goal */
    if (previousGoal^ === None) {
      previousGoal := positions[Array.length(positions) - 1];
    };

    /* jump */
    previousGoal^
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);

  | ToggleDocking =>
    instance.view |> Views.toggleDocking |> ignore;
    resolve(None);
  | Give =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view
           |> Views.inquire("Give", "expression to give:", "")
           |> thenOk(result => {
                goal |> Goal.setContent(result) |> ignore;
                instance |> buff(Give(goal, index));
              });
         } else {
           instance |> buff(Give(goal, index));
         }
       )

  | WhyInScope =>
    let selectedText =
      instance.editors.source |> Atom.TextEditor.getSelectedText;
    if (String.isEmpty(selectedText)) {
      instance.view
      |> Views.inquire("Scope info", "name:", "")
      |> thenOk(expr =>
           instance
           |> getPointedGoal
           |> thenOk(getGoalIndex)
           |> thenOk(((_, index)) =>
                instance |> buff(WhyInScope(expr, index))
              )
         );
    } else {
      /* global */
      instance |> buff(WhyInScopeGlobal(selectedText));
    };

  | SearchAbout(normalization) =>
    instance.view
    |> Views.inquire(
         "Searching through definitions ["
         ++ Command.Normalization.of_string(normalization)
         ++ "]",
         "expression to infer:",
         "",
       )
    |> thenOk(expr => instance |> buff(SearchAbout(normalization, expr)))

  | InferType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    /* goal-specific */
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view
           |> Views.inquire(
                "Infer type ["
                ++ Command.Normalization.of_string(normalization)
                ++ "]",
                "expression to infer:",
                "",
              )
           |> thenOk(expr =>
                instance |> buff(InferType(normalization, expr, index))
              );
         } else {
           instance |> buff(Give(goal, index));
         }
       )
    /* global  */
    |> handleOutOfGoal(_ =>
         instance.view
         |> Views.inquire(
              "Infer type ["
              ++ Command.Normalization.of_string(normalization)
              ++ "]",
              "expression to infer:",
              "",
            )
         |> thenOk(expr =>
              instance |> buff(InferTypeGlobal(normalization, expr))
            )
       )

  | ModuleContents(normalization) =>
    instance.view
    |> Views.inquire(
         "Module contents ["
         ++ Command.Normalization.of_string(normalization)
         ++ "]",
         "module name:",
         "",
       )
    |> thenOk(expr =>
         instance
         |> getPointedGoal
         |> thenOk(getGoalIndex)
         |> thenOk(((_, index)) =>
              instance |> buff(ModuleContents(normalization, expr, index))
            )
         |> handleOutOfGoal(_ =>
              instance |> buff(ModuleContentsGlobal(normalization, expr))
            )
       )

  | ComputeNormalForm(computeMode) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view
           |> Views.inquire(
                "Compute normal form",
                "expression to normalize:",
                "",
              )
           |> thenOk(expr =>
                instance |> buff(ComputeNormalForm(computeMode, expr, index))
              );
         } else {
           let expr = Goal.getContent(goal);
           instance |> buff(ComputeNormalForm(computeMode, expr, index));
         }
       )
    |> handleOutOfGoal(_ =>
         instance.view
         |> Views.inquire(
              "Compute normal form",
              "expression to normalize:",
              "",
            )
         |> thenOk(expr =>
              instance |> buff(ComputeNormalFormGlobal(computeMode, expr))
            )
       )

  | Refine =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) => instance |> buff(Refine(goal, index)))

  | Auto =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) => instance |> buff(Refine(goal, index)))

  | Case =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view
           |> Views.inquire("Case", "expression to case:", "")
           |> thenOk(result => {
                goal |> Goal.setContent(result) |> ignore;
                instance |> buff(Case(goal, index));
              });
         } else {
           instance |> buff(Case(goal, index));
         }
       )

  | GoalType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((_, index)) =>
         instance |> buff(GoalType(normalization, index))
       )
  | Context(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((_, index)) =>
         instance |> buff(Context(normalization, index))
       )
  | GoalTypeAndContext(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((_, index)) =>
         instance |> buff(GoalTypeAndContext(normalization, index))
       )

  | GoalTypeAndInferredType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         instance
         |> buff(GoalTypeAndInferredType(normalization, goal, index))
       )

  | InputSymbol(symbol) =>
    let enabled = Atom.Environment.Config.get("agda-mode.inputMethod");
    if (enabled) {
      switch (symbol) {
      | Ordinary =>
        instance.view.activatePanel |> Event.emitOk(true);
        instance.view.activateInputMethod |> Event.emitOk(true);
      | CurlyBracket =>
        instance.view.interceptAndInsertKey |> Event.emitOk("{")
      | Bracket => instance.view.interceptAndInsertKey |> Event.emitOk("[")
      | Parenthesis =>
        instance.view.interceptAndInsertKey |> Event.emitOk("(")
      | DoubleQuote =>
        instance.view.interceptAndInsertKey |> Event.emitOk("\"")
      | SingleQuote =>
        instance.view.interceptAndInsertKey |> Event.emitOk("'")
      | BackQuote => instance.view.interceptAndInsertKey |> Event.emitOk("`")
      };
      ();
    } else {
      instance.editors
      |> Editors.Focus.get
      |> Atom.TextEditor.insertText("\\")
      |> ignore;
    };
    resolve(None);

  | GotoDefinition =>
    if (instance.loaded) {
      let name =
        instance |> recoverCursor(() => getSelectedTextNode(instance));

      instance
      |> getPointedGoal
      |> thenOk(getGoalIndex)
      |> thenOk(((_, index)) =>
           instance |> buff(GotoDefinition(name, index))
         )
      |> handleOutOfGoal(_ => instance |> buff(GotoDefinitionGlobal(name)));
    } else {
      /* dispatch again if not already loaded  */
      instance
      |> dispatch(Command.Primitive.Load)
      |> handleCommandError(instance)
      |> thenOk(_ =>
           instance |> handleLocalCommand(Command.Primitive.GotoDefinition)
         );
    }
  | _ => instance |> buff(Load)
  };
}
and handleResponse =
    (instance: t, response: Response.t): Async.t(unit, Command.error) => {
  let textEditor = instance.editors.source;
  let filePath = textEditor |> Atom.TextEditor.getPath;
  let textBuffer = textEditor |> Atom.TextEditor.getBuffer;
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
      instance.view
      |> Views.display(
           "Status",
           Type.View.Header.PlainText,
           Emacs(
             PlainText(
               "Typechecked: "
               ++ string_of_bool(checked)
               ++ "\nDisplay implicit arguments: "
               ++ string_of_bool(displayImplicit),
             ),
           ),
         )
      |> ignore;
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
    | None =>
      Js.log("error: cannot find goal #" ++ string_of_int(index));
      resolve();
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
      instance |> dispatch(Command.Primitive.Load);
    | None => reject(Command.OutOfGoal)
    };
  | DisplayInfo(info) =>
    instance.view.activatePanel |> Event.emitOk(true);
    Response.Info.handle(info, (x, y, z) =>
      Views.display(x, y, z, instance.view)
    );
  | ClearHighlighting =>
    instance |> Highlightings.destroyAll;
    resolve();
  | _ =>
    Js.log(response);
    resolve();
  };
}
and dispatch = (command, instance): Async.t(unit, Command.error) => {
  instance
  |> handleLocalCommand(command)
  |> thenOk(remote =>
       switch (remote) {
       | None => resolve([||])
       | Some(cmd) =>
         let serialized = Command.Remote.serialize(cmd);
         /* send the serialized command */
         cmd.connection
         |> Connection.send(serialized)
         /* parse the returned response */
         |> mapOk(Emacs.Parser.SExpression.parseFile)
         |> mapOk(Array.map(Result.flatMap(Response.parse)))
         |> mapError(_ => Command.Cancelled);
       }
     )
  |> thenOk((result: array(result(Response.t, string))) => {
       /* array of parsed responses */
       let responses = result |> Array.filterMap(Option.fromResult);
       /* handle the responses and collect the errors if there's any */
       instance
       |> recoverCursor(() =>
            responses |> Array.map(handleResponse(instance))
          )
       |> all
       |> mapOk(_ => ());
     });
};

let dispatchUndo = _instance => {
  Js.log("Undo");
};
