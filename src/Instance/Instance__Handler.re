open Rebase;
open Async;

open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;

open TextEditors;

let handleCommandError = instance =>
  thenError((error: error) => {
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
             );
           })

      | ConnectionError(error) =>
        let (header, body) = Connection.Error.toString(error);
        instance.view.display(
          "Connection-related Error: " ++ header,
          Type.View.Header.Error,
          Emacs(PlainText(body)),
        );
      | Cancelled =>
        instance.view.display(
          "Query Cancelled",
          Type.View.Header.Error,
          Emacs(PlainText("")),
        )
      | GoalNotIndexed =>
        instance.view.display(
          "Goal not indexed",
          Type.View.Header.Error,
          Emacs(PlainText("Please reload to re-index the goal")),
        )
      | OutOfGoal =>
        instance.view.display(
          "Out of goal",
          Type.View.Header.Error,
          Emacs(PlainText("Please place the cursor in a goal")),
        )
      }
    )
    |> ignore;
    instance.editors |> Editors.Focus.on(Editors.Source);
    resolve();
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

let handleResponse = (instance, response: Response.t): Async.t(unit, error) => {
  let textEditor = instance.editors.source;
  let filePath = instance |> Instance__TextEditors.getPath;
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
    |> mapError(_ => Cancelled)
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
    resolve();
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
    let pointed = pointingAt(instance);
    switch (pointed) {
    | Some(goal) =>
      switch (makeCaseType) {
      | Function => Goal.writeLines(lines, goal)
      | ExtendedLambda => Goal.writeLambda(lines, goal)
      };
      instance |> instance.dispatch(Command.Primitive.Load);
    | None => reject(OutOfGoal)
    };
  | DisplayInfo(info) =>
    let (text, style, body) = handleDisplayInfo(info);
    instance.view.display(text, style, body);
    resolve();
  | ClearHighlighting =>
    instance |> Highlightings.destroyAll;
    resolve();
  | NoStatus => resolve()
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

    resolve();
  | ClearRunningInfo => resolve()
  | DoneAborting =>
    instance.view.display(
      "Status",
      Type.View.Header.Warning,
      Emacs(PlainText("Done aborting")),
    )
    |> ignore;
    resolve();
  | SolveAll(solutions) =>
    let solve = ((index, solution)) => {
      switch (Goals.find(index, instance)) {
      | None => resolve()
      | Some(goal) =>
        goal |> Goal.setContent(solution) |> ignore;
        Goals.setCursor(goal, instance);
        instance.dispatch(Give, instance);
      };
    };

    // solve them one by one
    solutions
    |> Array.reduce(
         (promise, solution) =>
           promise |> thenOk(() => solve(solution) |> thenOk(() => resolve())),
         resolve(),
       )
    |> thenOk(() => {
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
         resolve();
       });
  };
};

let handleResponseAndRecoverCursor = (instance, response) =>
  instance
  |> updateCursorPosition(() => handleResponse(instance, response))
  |> mapOk(_ => ());

/* Primitive Command => Remote Command */
let rec handleLocalCommand =
        (command: Command.Primitive.t, instance)
        : Async.t(option(Command.Remote.t), error) => {
  let buff = (command, instance) => {
    Connections.get(instance)
    |> mapOk((connection: Connection.t) => {
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
    |> mapError(_ => Cancelled);
  };
  switch (command) {
  | Load =>
    instance.editors.source
    |> Atom.TextEditor.save  // force save before load
    |> fromPromise
    |> mapError(_ => Cancelled)
    |> thenOk(() => {
         instance.isLoaded = true;
         instance.view.activate();
         instance.view.updateShouldDisplay(true);
         instance.view.display(
           "Connecting ...",
           Type.View.Header.PlainText,
           Emacs(PlainText("")),
         )
         |> ignore;
         instance |> buff(Load);
       })
  | Abort => instance |> buff(Abort)
  | Quit =>
    Connections.disconnect(instance);
    instance |> Goals.destroyAll;
    instance |> Highlightings.destroyAll;
    instance.view.deactivate();
    instance.isLoaded = false;
    instance.view.updateShouldDisplay(false);
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
    let nextGoal = instance |> Goals.getNextGoalPosition;
    /* jump */
    nextGoal
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);
  | PreviousGoal =>
    let previousGoal = instance |> Goals.getPreviousGoalPosition;
    /* jump */
    previousGoal
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);

  | ToggleDocking =>
    instance.view.toggleDocking();
    resolve(None);
  | Give =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view.inquire("Give", "expression to give:", "")
           |> mapError(_ => Cancelled)
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
      instance.view.inquire("Scope info", "name:", "")
      |> mapError(_ => Cancelled)
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
    instance.view.inquire(
      "Searching through definitions ["
      ++ Command.Normalization.toString(normalization)
      ++ "]",
      "expression to infer:",
      "",
    )
    |> mapError(_ => Cancelled)
    |> thenOk(expr => instance |> buff(SearchAbout(normalization, expr)))

  | InferType(normalization) =>
    instance
    |> getPointedGoal
    |> thenOk(getGoalIndex)
    /* goal-specific */
    |> thenOk(((goal, index)) =>
         if (Goal.isEmpty(goal)) {
           instance.view.inquire(
             "Infer type ["
             ++ Command.Normalization.toString(normalization)
             ++ "]",
             "expression to infer:",
             "",
           )
           |> mapError(_ => Cancelled)
           |> thenOk(expr =>
                instance |> buff(InferType(normalization, expr, index))
              );
         } else {
           instance |> buff(Give(goal, index));
         }
       )
    /* global  */
    |> handleOutOfGoal(_ =>
         instance.view.inquire(
           "Infer type ["
           ++ Command.Normalization.toString(normalization)
           ++ "]",
           "expression to infer:",
           "",
         )
         |> mapError(_ => Cancelled)
         |> thenOk(expr =>
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
    |> mapError(_ => Cancelled)
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
           instance.view.inquire(
             "Compute normal form",
             "expression to normalize:",
             "",
           )
           |> mapError(_ => Cancelled)
           |> thenOk(expr =>
                instance |> buff(ComputeNormalForm(computeMode, expr, index))
              );
         } else {
           let expr = Goal.getContent(goal);
           instance |> buff(ComputeNormalForm(computeMode, expr, index));
         }
       )
    |> handleOutOfGoal(_ =>
         instance.view.inquire(
           "Compute normal form",
           "expression to normalize:",
           "",
         )
         |> mapError(_ => Cancelled)
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
           instance.view.inquire("Case", "expression to case:", "")
           |> mapError(_ => Cancelled)
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
    let enabled = Atom.Config.get("agda-mode.inputMethod");
    if (enabled) {
      instance.view.updateShouldDisplay(true);
      switch (symbol) {
      | Ordinary =>
        instance.view.activate();
        instance.view.activateInputMethod(true);
      | CurlyBracket => instance.view.interceptAndInsertKey("{")
      | Bracket => instance.view.interceptAndInsertKey("[")
      | Parenthesis => instance.view.interceptAndInsertKey("(")
      | DoubleQuote => instance.view.interceptAndInsertKey("\"")
      | SingleQuote => instance.view.interceptAndInsertKey("'")
      | BackQuote => instance.view.interceptAndInsertKey("`")
      | Abort => instance.view.activateInputMethod(false)
      };
      ();
    } else {
      instance.editors
      |> Editors.Focus.get
      |> Atom.TextEditor.insertText("\\")
      |> ignore;
    };
    resolve(None);

  | QuerySymbol =>
    let selected = instance.editors |> Editors.getSelectedSymbol;
    let getSymbol =
      if (String.isEmpty(String.trim(selected))) {
        instance.view.updateShouldDisplay(true);
        instance.view.activate();
        instance.view.inquire(
          "Lookup Unicode Symbol Input Sequence",
          "symbol to lookup:",
          "",
        );
      } else {
        resolve(selected);
      };

    getSymbol
    |> finalOk(symbol =>
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
            )
       )
    |> ignore;
    resolve(None);

  | Jump(Type.Location.Range.HoleLink(index)) =>
    let positions = instance |> Goals.getPositions;

    instance.editors |> Editors.Focus.on(Source);
    positions[index]
    |> Option.forEach(position =>
         instance.editors.source
         |> Atom.TextEditor.setCursorBufferPosition(position)
       );
    resolve(None);
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
        resolve(None);
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

        Atom.Environment.Workspace.open_(uri, option)
        |> fromPromise
        |> then_(_ => resolve(None), _ => reject(Cancelled));
      };
    } else {
      resolve(None);
    };
  | GotoDefinition =>
    if (instance.isLoaded) {
      let name =
        instance
        |> updateCursorPosition(() =>
             Editors.getSelectedTextNode(instance.editors)
           );

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
      |> instance.dispatch(Command.Primitive.Load)
      |> handleCommandError(instance)
      |> thenOk(_ =>
           instance |> handleLocalCommand(Command.Primitive.GotoDefinition)
         );
    }
  };
};

/* Remote Command => Responses */
let handleRemoteCommand =
    /* This still builds even when type is changed from 'a to unit.
       What is the point of an array of units? */
    (instance, handler, remote): Async.t(array(unit), error) =>
  switch (remote) {
  | None => resolve([||])
  | Some(cmd) =>
    // log setup
    Connections.get(instance)
    |> mapOk(connection => {
         // remove all old log entries if `cmd` is `Load`
         if (Command.Remote.isLoad(cmd)
             && connection.Connection.resetLogOnLoad) {
           Connection.resetLog(connection);
         };
         // create log entry for each `cmd`
         Metadata.createLogEntry(cmd.command, connection.metadata);
       })
    |> ignore;

    let handleResults = ref([||]);
    let parseErrors: ref(array(Parser.Error.t)) = ref([||]);
    let inputForAgda = Command.Remote.toAgdaReadableString(cmd);
    open Parser.Incr.Event;
    let onResponse = (resolve', reject') => (
      fun
      | Ok(OnResult(response)) => {
          let result =
            instance
            |> updateCursorPosition(() => handler(instance, response));
          handleResults := Array.concat([|result|], handleResults^);
        }
      | Ok(OnError(error)) =>
        parseErrors := Array.concat([|error|], parseErrors^)
      | Ok(OnFinish) =>
        if (Array.length(parseErrors^) > 0) {
          reject'(ParseError(parseErrors^)) |> ignore;
        } else {
          handleResults^
          |> all
          |> thenOk(results => resolve'(results) |> resolve)
          |> ignore;
        }
      | Error(error) =>
        reject'(ConnectionError(Connection.Error.ConnectionError(error)))
        |> ignore
    );

    Async.make((resolve', reject') =>
      Connections.get(instance)
      |> mapOk(connection =>
           connection
           |> Connection.send(inputForAgda)
           |> Event.on(onResponse(resolve', reject'))
           |> ignore
         )
      |> ignore
    );
  };

let dispatch = (command, instance): Async.t(unit, error) => {
  instance
  |> handleLocalCommand(command)
  |> pass(_ => startCheckpoint(command, instance))
  |> pass(_ => instance.view.updateIsPending(true))
  |> thenOk(handleRemoteCommand(instance, handleResponse))
  |> pass(_ => endCheckpoint(instance))
  |> pass(_ => instance.view.updateIsPending(false))
  |> mapOk(_ => ());
};
