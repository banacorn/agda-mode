open Rebase;

open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;

open TextEditors;

let handleCommandError = (promise, instance) =>
  promise->Promise.mapError((error: error) => {
    (
      switch (error) {
      | ParseError(errors) =>
        instance.connection
        |> Option.forEach(conn => {
             // log the errors
             errors
             |> Array.forEach(e =>
                  Metadata.logError(e, conn.Connection.metadata)
                );
             // and display with the log
             instance.view.display(
               "Parse Error",
               Type.View.Header.Error,
               Emacs(ParseError(conn.Connection.metadata)),
             )
             |> ignore;
           })

      | ConnectionError(error) =>
        let (header, body) = Connection2.Error.toString(error);
        instance.view.display(
          "Connection-related Error: " ++ header,
          Type.View.Header.Error,
          Emacs(PlainText(body)),
        )
        |> ignore;
      | Cancelled =>
        instance.view.display(
          "Query Cancelled",
          Type.View.Header.Error,
          Emacs(PlainText("")),
        )
        |> ignore
      | GoalNotIndexed =>
        instance.view.display(
          "Goal not indexed",
          Type.View.Header.Error,
          Emacs(PlainText("Please reload to re-index the goal")),
        )
        |> ignore
      | OutOfGoal =>
        instance.view.display(
          "Out of goal",
          Type.View.Header.Error,
          Emacs(PlainText("Please place the cursor in a goal")),
        )
        |> ignore
      }
    )
    |> ignore;
    instance.editors |> Editors.Focus.on(Editors.Source);
  });

let handleDisplayInfo =
    (info: Response.Info.t): (string, Type.View.Header.style, Body.t) => {
  /* open Response.Info; */
  Type.View.(
    switch (info) {
    | CompilationOk => ("Compilation Done!", Header.Success, Nothing)
    | Constraints(None) => ("No Constraints", Header.Success, Nothing)
    | Constraints(Some(payload)) => (
        "Constraints",
        Header.Info,
        Emacs(Constraints(payload)),
      )
    | AllGoalsWarnings(payload) => (
        payload.title,
        Header.Info,
        Emacs(AllGoalsWarnings(payload)),
      )
    | Time(payload) => (
        "Time",
        Header.PlainText,
        Emacs(PlainText(payload)),
      )
    | Error(payload) => ("Error", Header.Error, Emacs(Error(payload)))
    | Intro(payload) => (
        "Intro",
        Header.PlainText,
        Emacs(PlainText(payload)),
      )
    | Auto(payload) => (
        "Auto",
        Header.PlainText,
        Emacs(PlainText(payload)),
      )
    | ModuleContents(payload) => (
        "Module Contents",
        Header.Info,
        Emacs(PlainText(payload)),
      )
    | SearchAbout(payload) => (
        "Searching about ...",
        Header.PlainText,
        Emacs(SearchAbout(payload)),
      )
    | WhyInScope(payload) => (
        "Scope info",
        Header.Info,
        Emacs(WhyInScope(payload)),
      )
    | NormalForm(payload) => (
        "Normal form",
        Header.Info,
        Emacs(PlainText(payload)),
      )
    | GoalType(payload) => (
        "Goal type",
        Header.Info,
        Emacs(GoalTypeContext(payload)),
      )
    | CurrentGoal(payload) => (
        "Current goal",
        Header.Info,
        Emacs(PlainText(payload)),
      )
    | InferredType(payload) => (
        "Inferred type",
        Header.Info,
        Emacs(PlainText(payload)),
      )
    | Context(payload) => ("Context", Header.Info, Emacs(Context(payload)))
    | HelperFunction(payload) => (
        "Helper function",
        Header.Info,
        Emacs(PlainText(payload)),
      )
    | Version(payload) => (
        "Version",
        Header.Info,
        Emacs(PlainText(payload)),
      )
    }
  );
};

let handleResponse =
    (instance, response: Response.t): Promise.t(result(unit, error)) => {
  let textEditor = instance.editors.source;
  let filePath = instance |> Instance__TextEditors.getPath;
  let textBuffer = textEditor |> Atom.TextEditor.getBuffer;
  switch (response) {
  | HighlightingInfoDirect(_remove, annotations) =>
    annotations
    |> Array.filter(Highlighting.Annotation.shouldHighlight)
    |> Array.forEach(annotation => instance |> Highlightings.add(annotation));
    Promise.resolved(Ok());
  | HighlightingInfoIndirect(filepath) =>
    Highlightings.addFromFile(filepath, instance)
    ->Promise.map(() => Ok(N.Fs.unlink(filepath, _ => ())))
  | Status(displayImplicit, checked) =>
    if (displayImplicit || checked) {
      instance.view.display(
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
    Promise.resolved(Ok());
  | JumpToError(targetFilePath, index) =>
    if (targetFilePath == filePath) {
      let point =
        textBuffer |> Atom.TextBuffer.positionForCharacterIndex(index - 1);
      Js.Global.setTimeout(
        _ => Atom.TextEditor.setCursorBufferPosition(point, textEditor),
        0,
      )
      |> ignore;
    };
    Promise.resolved(Ok());
  | InteractionPoints(indices) =>
    instance |> Goals.instantiateAll(indices);
    Promise.resolved(Ok());
  | GiveAction(index, give) =>
    switch (Goals.find(index, instance)) {
    | None =>
      Js.log("error: cannot find goal #" ++ string_of_int(index));
      Promise.resolved(Ok());
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
      Promise.resolved(Ok());
    }
  | MakeCase(makeCaseType, lines) =>
    let pointed = pointingAt(instance);
    switch (pointed) {
    | Some(goal) =>
      switch (makeCaseType) {
      | Function => Goal.writeLines(lines, goal)
      | ExtendedLambda => Goal.writeLambda(lines, goal)
      };
      instance |> instance.dispatch(Command.Primitive.Load);
    | None => Promise.resolved(Error(OutOfGoal))
    };
  | DisplayInfo(info) =>
    let (text, style, body) = handleDisplayInfo(info);
    instance.view.display(text, style, body);
    Promise.resolved(Ok());
  | ClearHighlighting =>
    instance |> Highlightings.destroyAll;
    Promise.resolved(Ok());
  | NoStatus => Promise.resolved(Ok())

  | RunningInfo(verbosity, message) =>
    if (verbosity >= 2) {
      instance.runningInfo
      |> RunningInfo.add(Parser.agdaOutput(message))
      |> ignore;
    } else {
      instance.view.display(
        "Type-checking",
        Type.View.Header.PlainText,
        Emacs(PlainText(message)),
      )
      |> ignore;
    };

    Promise.resolved(Ok());

  | ClearRunningInfo => Promise.resolved(Ok())

  | DoneAborting =>
    instance.view.display(
      "Status",
      Type.View.Header.Warning,
      Emacs(PlainText("Done aborting")),
    )
    |> ignore;
    Promise.resolved(Ok());

  | SolveAll(solutions) =>
    let solve = ((index, solution)) => {
      switch (Goals.find(index, instance)) {
      | None => Promise.resolved(Ok())
      | Some(goal) =>
        goal |> Goal.setContent(solution) |> ignore;
        Goals.setCursor(goal, instance);
        instance.dispatch(Give, instance);
      };
    };

    // solve them one by one

    Array.reduce(
      (promise, solution) =>
        promise->Promise.flatMapOk(() => solve(solution)),
      Promise.resolved(Ok()),
      solutions,
    )
    ->Promise.mapOk(() => {
        let size = Array.length(solutions);
        if (size == 0) {
          instance.view.display(
            "No solutions found",
            Type.View.Header.PlainText,
            Emacs(PlainText("")),
          );
        } else {
          instance.view.display(
            string_of_int(size) ++ " goals solved",
            Type.View.Header.Success,
            Emacs(PlainText("")),
          );
        };
        ();
      });
  };
};

let handleResponseAndRecoverCursor = (instance, response) =>
  instance |> updateCursorPosition(() => handleResponse(instance, response));
// |> mapOk(_ => ());

/* Primitive Command => Remote Command */
let rec handleLocalCommand =
        (command: Command.Primitive.t, instance)
        : Promise.t(result(option(Command.Remote.t), error)) => {
  let buff = (command, instance) => {
    Connections.get(instance)
    ->Promise.mapOk((connection: Connection.t) => {
        instance.view.display(
          "Loading ...",
          Type.View.Header.PlainText,
          Emacs(PlainText("")),
        );

        Some(
          {
            version: connection.metadata.version,
            filepath: instance |> Instance__TextEditors.getPath,
            command,
          }: Command.Remote.t,
        );
      })
    ->Promise.mapError(_ => Cancelled);
  };
  switch (command) {
  | Load =>
    instance.editors.source
    ->Atom.TextEditor.save // force save before load
    ->Promise.Js.fromBsPromise
    ->Promise.Js.toResult
    ->Promise.mapError(_ => Cancelled)
    ->Promise.flatMapOk(() => {
        instance.isLoaded = true;
        instance.view.activate()
        ->Promise.flatMap(_ => {
            instance.view.activate();
            instance.view.display(
              "Connecting ...",
              Type.View.Header.PlainText,
              Emacs(PlainText("")),
            );
            instance |> buff(Load);
          });
      })
  | Abort => instance |> buff(Abort)
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;
    instance.view.deactivate();
    instance.isLoaded = false;
    instance.view.deactivate();
    Promise.resolved(Ok(None));
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
    let nextGoal = instance |> Goals.getNextGoalPosition;
    /* jump */
    nextGoal
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    Promise.resolved(Ok(None));
  | PreviousGoal =>
    let previousGoal = instance |> Goals.getPreviousGoalPosition;
    /* jump */
    previousGoal
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    Promise.resolved(Ok(None));

  | ToggleDocking =>
    instance.view.toggleDocking();
    Promise.resolved(Ok(None));
  | Give =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((goal, index)) =>
        if (Goal.isEmpty(goal)) {
          instance.view.inquire("Give", "expression to give:", "")
          ->Promise.mapError(_ => Cancelled)
          ->Promise.flatMapOk(result => {
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
      instance.view.inquire("Scope info", "name:", "")
      ->Promise.mapError(_ => Cancelled)
      ->Promise.flatMapOk(expr =>
          instance
          ->getPointedGoal
          ->Promise.flatMapOk(getGoalIndex)
          ->Promise.flatMapOk(((_, index)) =>
              instance |> buff(WhyInScope(expr, index))
            )
        );
    } else {
      /* global */
      instance |> buff(WhyInScopeGlobal(selectedText));
    };

  | SearchAbout(normalization) =>
    instance.view.inquire(
      "Searching through definitions ["
      ++ Command.Normalization.toString(normalization)
      ++ "]",
      "expression to infer:",
      "",
    )
    ->Promise.mapError(_ => Cancelled)
    ->Promise.flatMapOk(expr =>
        instance |> buff(SearchAbout(normalization, expr))
      )

  | InferType(normalization) =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    /* goal-specific */
    ->Promise.flatMapOk(((goal, index)) =>
        if (Goal.isEmpty(goal)) {
          instance.view.inquire(
            "Infer type ["
            ++ Command.Normalization.toString(normalization)
            ++ "]",
            "expression to infer:",
            "",
          )
          ->Promise.mapError(_ => Cancelled)
          ->Promise.flatMapOk(expr =>
              instance |> buff(InferType(normalization, expr, index))
            );
        } else {
          instance |> buff(Give(goal, index));
        }
      )
    /* global  */
    ->handleOutOfGoal(_ =>
        instance.view.inquire(
          "Infer type ["
          ++ Command.Normalization.toString(normalization)
          ++ "]",
          "expression to infer:",
          "",
        )
        ->Promise.mapError(_ => Cancelled)
        ->Promise.flatMapOk(expr =>
            instance |> buff(InferTypeGlobal(normalization, expr))
          )
      )

  | ModuleContents(normalization) =>
    instance.view.inquire(
      "Module contents ["
      ++ Command.Normalization.toString(normalization)
      ++ "]",
      "module name:",
      "",
    )
    ->Promise.mapError(_ => Cancelled)
    ->Promise.flatMapOk(expr =>
        instance
        ->getPointedGoal
        ->Promise.flatMapOk(getGoalIndex)
        ->Promise.flatMapOk(((_, index)) =>
            instance |> buff(ModuleContents(normalization, expr, index))
          )
        ->handleOutOfGoal(_ =>
            instance |> buff(ModuleContentsGlobal(normalization, expr))
          )
      )

  | ComputeNormalForm(computeMode) =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((goal, index)) =>
        if (Goal.isEmpty(goal)) {
          instance.view.inquire(
            "Compute normal form",
            "expression to normalize:",
            "",
          )
          ->Promise.mapError(_ => Cancelled)
          ->Promise.flatMapOk(expr =>
              instance |> buff(ComputeNormalForm(computeMode, expr, index))
            );
        } else {
          let expr = Goal.getContent(goal);
          instance |> buff(ComputeNormalForm(computeMode, expr, index));
        }
      )
    ->handleOutOfGoal(_ =>
        instance.view.inquire(
          "Compute normal form",
          "expression to normalize:",
          "",
        )
        ->Promise.mapError(_ => Cancelled)
        ->Promise.flatMapOk(expr =>
            instance |> buff(ComputeNormalFormGlobal(computeMode, expr))
          )
      )

  | Refine =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((goal, index)) =>
        instance |> buff(Refine(goal, index))
      )

  | Auto =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((goal, index)) =>
        instance |> buff(Auto(goal, index))
      )

  | Case =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((goal, index)) =>
        if (Goal.isEmpty(goal)) {
          instance.view.inquire("Case", "expression to case:", "")
          ->Promise.mapError(_ => Cancelled)
          ->Promise.flatMapOk(result => {
              goal |> Goal.setContent(result) |> ignore;
              instance |> buff(Case(goal, index));
            });
        } else {
          instance |> buff(Case(goal, index));
        }
      )

  | GoalType(normalization) =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((_, index)) =>
        instance |> buff(GoalType(normalization, index))
      )
  | Context(normalization) =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((_, index)) =>
        instance |> buff(Context(normalization, index))
      )
  | GoalTypeAndContext(normalization) =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((_, index)) =>
        instance |> buff(GoalTypeAndContext(normalization, index))
      )

  | GoalTypeAndInferredType(normalization) =>
    instance
    ->getPointedGoal
    ->Promise.flatMapOk(getGoalIndex)
    ->Promise.flatMapOk(((goal, index)) =>
        instance |> buff(GoalTypeAndInferredType(normalization, goal, index))
      )

  | InputSymbol(symbol) =>
    let enabled = Atom.Config.get("agda-mode.inputMethod");
    if (enabled) {
      instance.view.activate();
      switch (symbol) {
      | Ordinary =>
        instance.view.activate()
        ->Promise.flatMap(_ => {
            instance.view.activateInputMethod(true);
            Promise.resolved(Ok(None));
          })
      | CurlyBracket =>
        instance.view.interceptAndInsertKey("{");
        Promise.resolved(Ok(None));
      | Bracket =>
        instance.view.interceptAndInsertKey("[");
        Promise.resolved(Ok(None));
      | Parenthesis =>
        instance.view.interceptAndInsertKey("(");
        Promise.resolved(Ok(None));
      | DoubleQuote =>
        instance.view.interceptAndInsertKey("\"");
        Promise.resolved(Ok(None));
      | SingleQuote =>
        instance.view.interceptAndInsertKey("'");
        Promise.resolved(Ok(None));
      | BackQuote =>
        instance.view.interceptAndInsertKey("`");
        Promise.resolved(Ok(None));
      | Abort =>
        instance.view.activateInputMethod(false);
        Promise.resolved(Ok(None));
      };
    } else {
      instance.editors
      |> Editors.Focus.get
      |> Atom.TextEditor.insertText("\\")
      |> ignore;
      Promise.resolved(Ok(None));
    };

  | QuerySymbol =>
    let selected = instance.editors |> Editors.getSelectedSymbol;
    let getSymbol =
      if (String.isEmpty(String.trim(selected))) {
        instance.view.activate();
        instance.view.inquire(
          "Lookup Unicode Symbol Input Sequence",
          "symbol to lookup:",
          "",
        );
      } else {
        Promise.resolved(Ok(selected));
      };

    getSymbol->Promise.getOk(symbol =>
      symbol
      |> Translator.lookup
      |> Option.forEach(sequences =>
           instance.view.display(
             "Input sequence for " ++ symbol,
             Type.View.Header.PlainText,
             Emacs(
               PlainText(
                 sequences |> List.fromArray |> String.joinWith("\n"),
               ),
             ),
           )
           |> ignore
         )
    )
    |> ignore;
    Promise.resolved(Ok(None));

  | Jump(Type.Location.Range.HoleLink(index)) =>
    let positions = instance |> Goals.getPositions;

    instance.editors |> Editors.Focus.on(Source);
    positions[index]
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    Promise.resolved(Ok(None));
  | Jump(Type.Location.Range.RangeLink(range)) =>
    open Type.Location.Range;
    let filePath = instance |> Instance__TextEditors.getPath;
    let (shouldJump, otherFilePath) =
      switch (range) {
      | NoRange => (false, None)
      | Range(None, _) => (true, None)
      | Range(Some(path), _) => (
          true,
          path == filePath ? None : Some(path),
        )
      };
    if (shouldJump) {
      switch (otherFilePath) {
      | None =>
        let ranges = toAtomRanges(range);
        if (ranges[0] |> Option.isSome) {
          Js.Global.setTimeout(
            _ =>
              instance.editors.source
              |> Atom.TextEditor.setSelectedBufferRanges(ranges),
            0,
          )
          |> ignore;
        };
        Promise.resolved(Ok(None));
      | Some(uri) =>
        let (line, column) =
          switch (range) {
          | NoRange => (0, 0)
          | Range(_, is) =>
            switch (is[0]) {
            | None => (0, 0)
            | Some(i) => (i.start.line - 1, i.start.col - 1)
            }
          };
        let option = {
          "initialLine": line,
          "initialColumn": column,
          "split": "right",
          "activatePane": true,
          "activateItem": true,
          "pending": false,
          "searchAllPanes": true,
          "location": (None: option(string)),
        };

        Atom.Workspace.open_(uri, option)
        ->Promise.Js.fromBsPromise
        ->Promise.Js.toResult
        ->Promise.map(
            fun
            | Error(_) => Error(Cancelled)
            | Ok(_) => Ok(None),
          );
      };
    } else {
      Promise.resolved(Ok(None));
    };
  | GotoDefinition =>
    if (instance.isLoaded) {
      let name =
        instance
        |> updateCursorPosition(() =>
             Editors.getSelectedTextNode(instance.editors)
           );

      instance
      ->getPointedGoal
      ->Promise.flatMapOk(getGoalIndex)
      ->Promise.flatMapOk(((_, index)) =>
          instance |> buff(GotoDefinition(name, index))
        )
      ->handleOutOfGoal(_ => instance |> buff(GotoDefinitionGlobal(name)));
    } else {
      /* dispatch again if not already loaded  */
      instance.dispatch(Command.Primitive.Load, instance)
      ->handleCommandError(instance)
      ->Promise.flatMap(_ =>
          instance |> handleLocalCommand(Command.Primitive.GotoDefinition)
        );
    }
  };
};

/* Remote Command => Responses */
let handleRemoteCommand =
    /* This still builds even when type is changed from 'a to unit.
       What is the point of an array of units? */
    (instance, handler, remote): Promise.t(result(unit, error)) =>
  switch (remote) {
  | None => Promise.resolved(Ok())
  | Some(cmd) =>
    // log setup
    Connections.get(instance)
    ->Promise.getOk(connection => {
        // remove all old log entries if `cmd` is `Load`
        if (Command.Remote.isLoad(cmd) && connection.Connection.resetLogOnLoad) {
          Connection.resetLog(connection);
        };
        // create log entry for each `cmd`
        Metadata.createLogEntry(cmd.command, connection.metadata);
      });

    let handleResults = ref([||]);
    let parseErrors: ref(array(Parser.Error.t)) = ref([||]);
    let inputForAgda = Command.Remote.toAgdaReadableString(cmd);
    open Parser.Incr.Event;
    let onResponse = (resolve', reject') => (
      fun
      | Ok(OnResult(Ok(response))) => {
          let result =
            instance
            |> updateCursorPosition(() => handler(instance, response));
          handleResults := Array.concat([|result|], handleResults^);
        }
      | Ok(OnResult(Error(error))) =>
        parseErrors := Array.concat([|error|], parseErrors^)
      | Ok(OnFinish) =>
        if (Array.length(parseErrors^) > 0) {
          reject'(ParseError(parseErrors^)) |> ignore;
        } else {
          (handleResults^)
          ->List.fromArray
          ->Promise.all
          ->Promise.get(results => resolve'(results));
        }
      | Error(error) =>
        reject'(ConnectionError(Connection2.Error.ConnectionError(error)))
        |> ignore
    );
    let (promise, resolve) = Promise.pending();

    Connections.get(instance)
    ->Promise.getOk(connection =>
        Connection.send(inputForAgda, connection).on(
          onResponse(x => resolve(Ok(x)), x => resolve(Error(x))),
        )
        |> ignore
      );
    promise->Promise.mapOk(_ => ());
  };

let dispatch = (command, instance): Promise.t(result(unit, error)) => {
  handleLocalCommand(command, instance)
  ->Promise.tap(_ => startCheckpoint(command, instance))
  ->Promise.flatMap(x =>
      instance.view.updateIsPending(true)->Promise.map(() => x)
    )
  ->Promise.flatMapOk(handleRemoteCommand(instance, handleResponse))
  ->Promise.tap(_ => endCheckpoint(instance))
  ->Promise.flatMap(x =>
      instance.view.updateIsPending(false)->Promise.map(() => x)
    )
  ->Promise.mapOk(_ => instance.onDispatch.emit(Ok()))
  ->Promise.tapError(error => instance.onDispatch.emit(Error(error)));
};