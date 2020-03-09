open! Rebase;

open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;

// open TextEditors;
//
// let handleCommandError = (promise, instance) =>
//   promise->Promise.mapError((error: error) => {
//     (
//       switch (error) {
//       | ParseError(errors) =>
//         instance.connection
//         |> Option.forEach(conn => {
//              // log the errors
//              errors
//              |> Array.forEach(e => Log.logError(e, conn.Connection.log));
//              // and display with the log
//              instance.view.display(
//                "Parse Error",
//                Type.View.Header.Error,
//                Emacs(ParseError(conn)),
//              )
//              |> ignore;
//            })
//
//       | ConnectionError(error) =>
//         let (header, body) = Connection.Error.toString(error);
//         instance.view.display(
//           "Connection-related Error: " ++ header,
//           Type.View.Header.Error,
//           Emacs(PlainText(body)),
//         )
//         |> ignore;
//       | Cancelled =>
//         instance.view.display(
//           "Query Cancelled",
//           Type.View.Header.Error,
//           Emacs(PlainText("")),
//         )
//         |> ignore
//       | GoalNotIndexed =>
//         instance.view.display(
//           "Goal not indexed",
//           Type.View.Header.Error,
//           Emacs(PlainText("Please reload to re-index the goal")),
//         )
//         |> ignore
//       | OutOfGoal =>
//         instance.view.display(
//           "Out of goal",
//           Type.View.Header.Error,
//           Emacs(PlainText("Please place the cursor in a goal")),
//         )
//         |> ignore
//       }
//     )
//     |> ignore;
//     instance.editors |> Editors.Focus.on(Editors.Source);
//   });

// and handleResponseAndRecoverCursor = (instance, response) =>
//   instance |> restoreCursorPosition(() => handleResponse(instance, response))
//
// /* Command => Request */
// and handleCommand =
//     (command: Command.t, instance)
//     : Promise.t(result(option(Request.packed), error)) => {
//   let buff = (request, instance) => {
//     Connections.get(instance)
//     ->Promise.flatMapOk((connection: Connection.t) =>
//         instance.view.display(
//           "Loading ...",
//           Type.View.Header.PlainText,
//           Emacs(PlainText("")),
//         )
//         ->Promise.map(() =>
//             Ok(
//               Some(
//                 {
//                   version: connection.metadata.version,
//                   filepath: instance |> Instance__TextEditors.getPath,
//                   request,
//                 }: Request.packed,
//               ),
//             )
//           )
//       )
//     ->Promise.mapError(_ => Cancelled);
//   };
//   switch (command) {
//   | Load =>
//     instance.editors.source
//     ->Atom.TextEditor.save // force save before load
//     ->Promise.Js.fromBsPromise
//     ->Promise.Js.toResult
//     ->Promise.mapError(_ => Cancelled)
//     ->Promise.flatMapOk(() => {
//         instance.isLoaded = true;
//         // activate the view twice?
//         instance.view.activate()
//         ->Promise.flatMap(_ => instance.view.activate())
//         ->Promise.flatMap(_ =>
//             instance.view.display(
//               "Connecting ...",
//               Type.View.Header.PlainText,
//               Emacs(PlainText("")),
//             )
//           )
//         ->Promise.flatMap(_ => instance |> buff(Load));
//       })
//   | Abort => instance |> buff(Abort)
//   | Quit =>
//     Connections.disconnect(instance)
//     ->Promise.flatMap(_ => {
//         instance |> Goals.destroyAll;
//         instance |> Highlightings.destroyAll;
//         instance.view.deactivate();
//       })
//     ->Promise.flatMap(_ => {
//         instance.isLoaded = false;
//         instance.view.deactivate();
//       })
//     ->Promise.map(_ => Ok(None))
//   | Restart =>
//     Connections.disconnect(instance)
//     ->Promise.flatMap(_ => instance |> buff(Load))
//   | Compile => instance |> buff(Compile)
//   | ToggleDisplayOfImplicitArguments =>
//     instance |> buff(ToggleDisplayOfImplicitArguments)
//   | SolveConstraints => instance |> buff(SolveConstraints)
//   | ShowConstraints => instance |> buff(ShowConstraints)
//   | ShowGoals => instance |> buff(ShowGoals)
//   | NextGoal =>
//     let nextGoal = instance |> Goals.getNextGoalPosition;
//     /* jump */
//     nextGoal
//     |> Option.forEach(position =>
//          instance.editors.source
//          |> Atom.TextEditor.setCursorBufferPosition(position)
//        );
//     Promise.resolved(Ok(None));
//   | PreviousGoal =>
//     let previousGoal = instance |> Goals.getPreviousGoalPosition;
//     /* jump */
//     previousGoal
//     |> Option.forEach(position =>
//          instance.editors.source
//          |> Atom.TextEditor.setCursorBufferPosition(position)
//        );
//     Promise.resolved(Ok(None));
//
//   | ToggleDocking => instance.view.toggleDocking()->Promise.map(_ => Ok(None))
//   | Give =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((goal, index)) =>
//         if (Goal.isEmpty(goal)) {
//           instance.view.inquire("Give", "expression to give:", "")
//           ->Promise.mapError(_ => Cancelled)
//           ->Promise.flatMapOk(result => {
//               goal |> Goal.setContent(result) |> ignore;
//               instance |> buff(Give(goal, index));
//             });
//         } else {
//           instance |> buff(Give(goal, index));
//         }
//       )
//
//   | WhyInScope =>
//     let selectedText =
//       instance.editors.source |> Atom.TextEditor.getSelectedText;
//     if (String.isEmpty(selectedText)) {
//       instance.view.inquire("Scope info", "name:", "")
//       ->Promise.mapError(_ => Cancelled)
//       ->Promise.flatMapOk(expr =>
//           instance
//           ->getPointedGoal
//           ->Promise.flatMapOk(getGoalIndex)
//           ->Promise.flatMapOk(((_, index)) =>
//               instance |> buff(WhyInScope(expr, index))
//             )
//         );
//     } else {
//       /* global */
//       instance |> buff(WhyInScopeGlobal(selectedText));
//     };
//
//   | SearchAbout(normalization) =>
//     instance.view.inquire(
//       "Searching through definitions ["
//       ++ Command.Normalization.toString(normalization)
//       ++ "]",
//       "expression to infer:",
//       "",
//     )
//     ->Promise.mapError(_ => Cancelled)
//     ->Promise.flatMapOk(expr =>
//         instance |> buff(SearchAbout(normalization, expr))
//       )
//
//   | InferType(normalization) =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     /* goal-specific */
//     ->Promise.flatMapOk(((goal, index)) =>
//         if (Goal.isEmpty(goal)) {
//           instance.view.inquire(
//             "Infer type ["
//             ++ Command.Normalization.toString(normalization)
//             ++ "]",
//             "expression to infer:",
//             "",
//           )
//           ->Promise.mapError(_ => Cancelled)
//           ->Promise.flatMapOk(expr =>
//               instance |> buff(InferType(normalization, expr, index))
//             );
//         } else {
//           instance |> buff(Give(goal, index));
//         }
//       )
//     /* global  */
//     ->handleOutOfGoal(_ =>
//         instance.view.inquire(
//           "Infer type ["
//           ++ Command.Normalization.toString(normalization)
//           ++ "]",
//           "expression to infer:",
//           "",
//         )
//         ->Promise.mapError(_ => Cancelled)
//         ->Promise.flatMapOk(expr =>
//             instance |> buff(InferTypeGlobal(normalization, expr))
//           )
//       )
//
//   | ModuleContents(normalization) =>
//     instance.view.inquire(
//       "Module contents ["
//       ++ Command.Normalization.toString(normalization)
//       ++ "]",
//       "module name:",
//       "",
//     )
//     ->Promise.mapError(_ => Cancelled)
//     ->Promise.flatMapOk(expr =>
//         instance
//         ->getPointedGoal
//         ->Promise.flatMapOk(getGoalIndex)
//         ->Promise.flatMapOk(((_, index)) =>
//             instance |> buff(ModuleContents(normalization, expr, index))
//           )
//         ->handleOutOfGoal(_ =>
//             instance |> buff(ModuleContentsGlobal(normalization, expr))
//           )
//       )
//
//   | ComputeNormalForm(computeMode) =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((goal, index)) =>
//         if (Goal.isEmpty(goal)) {
//           instance.view.inquire(
//             "Compute normal form",
//             "expression to normalize:",
//             "",
//           )
//           ->Promise.mapError(_ => Cancelled)
//           ->Promise.flatMapOk(expr =>
//               instance |> buff(ComputeNormalForm(computeMode, expr, index))
//             );
//         } else {
//           let expr = Goal.getContent(goal);
//           instance |> buff(ComputeNormalForm(computeMode, expr, index));
//         }
//       )
//     ->handleOutOfGoal(_ =>
//         instance.view.inquire(
//           "Compute normal form",
//           "expression to normalize:",
//           "",
//         )
//         ->Promise.mapError(_ => Cancelled)
//         ->Promise.flatMapOk(expr =>
//             instance |> buff(ComputeNormalFormGlobal(computeMode, expr))
//           )
//       )
//
//   | Refine =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((goal, index)) =>
//         instance |> buff(Refine(goal, index))
//       )
//
//   | Auto =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((goal, index)) =>
//         instance |> buff(Auto(goal, index))
//       )
//
//   | Case =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((goal, index)) =>
//         if (Goal.isEmpty(goal)) {
//           instance.view.inquire("Case", "expression to case:", "")
//           ->Promise.mapError(_ => Cancelled)
//           ->Promise.flatMapOk(result => {
//               goal |> Goal.setContent(result) |> ignore;
//               instance |> buff(Case(goal, index));
//             });
//         } else {
//           instance |> buff(Case(goal, index));
//         }
//       )
//
//   | GoalType(normalization) =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((_, index)) =>
//         instance |> buff(GoalType(normalization, index))
//       )
//   | Context(normalization) =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((_, index)) =>
//         instance |> buff(Context(normalization, index))
//       )
//   | GoalTypeAndContext(normalization) =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((_, index)) =>
//         instance |> buff(GoalTypeAndContext(normalization, index))
//       )
//
//   | GoalTypeAndInferredType(normalization) =>
//     instance
//     ->getPointedGoal
//     ->Promise.flatMapOk(getGoalIndex)
//     ->Promise.flatMapOk(((goal, index)) =>
//         instance |> buff(GoalTypeAndInferredType(normalization, goal, index))
//       )
//
//   | InputSymbol(symbol) =>
//     let enabled = Atom.Config.get("agda-mode.inputMethod");
//     if (enabled) {
//       instance.view.activate()
//       ->Promise.flatMap(_ =>
//           switch (symbol) {
//           | Ordinary =>
//             instance.view.activate()
//             ->Promise.flatMap(_ => instance.view.activateInputMethod(true))
//           | CurlyBracket => instance.view.interceptAndInsertKey("{")
//           | Bracket => instance.view.interceptAndInsertKey("[")
//           | Parenthesis => instance.view.interceptAndInsertKey("(")
//           | DoubleQuote => instance.view.interceptAndInsertKey("\"")
//           | SingleQuote => instance.view.interceptAndInsertKey("'")
//           | BackQuote => instance.view.interceptAndInsertKey("`")
//           | Abort => instance.view.activateInputMethod(false)
//           }
//         )
//       ->Promise.map(_ => Ok(None));
//     } else {
//       instance.editors
//       |> Editors.Focus.get
//       |> Atom.TextEditor.insertText("\\")
//       |> ignore;
//       Promise.resolved(Ok(None));
//     };
//
//   | QuerySymbol =>
//     let selected = instance.editors |> Editors.getSelectedSymbol;
//     let getSymbol =
//       if (String.isEmpty(String.trim(selected))) {
//         instance.view.activate()
//         ->Promise.flatMap(_ =>
//             instance.view.inquire(
//               "Lookup Unicode Symbol Input Sequence",
//               "symbol to lookup:",
//               "",
//             )
//           );
//       } else {
//         Promise.resolved(Ok(selected));
//       };
//
//     getSymbol->Promise.getOk(symbol =>
//       symbol
//       |> Translator.lookup
//       |> Option.forEach(sequences =>
//            instance.view.display(
//              "Input sequence for " ++ symbol,
//              Type.View.Header.PlainText,
//              Emacs(
//                PlainText(
//                  sequences |> List.fromArray |> String.joinWith("\n"),
//                ),
//              ),
//            )
//            |> ignore
//          )
//     )
//     |> ignore;
//     Promise.resolved(Ok(None));
//
//   | Jump(Type.Location.Range.HoleLink(index)) =>
//     let positions = instance |> Goals.getPositions;
//
//     instance.editors |> Editors.Focus.on(Source);
//     positions[index]
//     |> Option.forEach(position =>
//          instance.editors.source
//          |> Atom.TextEditor.setCursorBufferPosition(position)
//        );
//     Promise.resolved(Ok(None));
//   | Jump(Type.Location.Range.RangeLink(range)) =>
//     open Type.Location.Range;
//     let filePath = instance |> Instance__TextEditors.getPath;
//     let (shouldJump, otherFilePath) =
//       switch (range) {
//       | NoRange => (false, None)
//       | Range(None, _) => (true, None)
//       | Range(Some(path), _) => (
//           true,
//           path == filePath ? None : Some(path),
//         )
//       };
//     if (shouldJump) {
//       switch (otherFilePath) {
//       | None =>
//         let ranges = toAtomRanges(range);
//         if (ranges[0] |> Option.isSome) {
//           Js.Global.setTimeout(
//             _ =>
//               instance.editors.source
//               |> Atom.TextEditor.setSelectedBufferRanges(ranges),
//             0,
//           )
//           |> ignore;
//         };
//         Promise.resolved(Ok(None));
//       | Some(uri) =>
//         let (line, column) =
//           switch (range) {
//           | NoRange => (0, 0)
//           | Range(_, is) =>
//             switch (is[0]) {
//             | None => (0, 0)
//             | Some(i) => (i.start.line - 1, i.start.col - 1)
//             }
//           };
//         let option = {
//           "initialLine": line,
//           "initialColumn": column,
//           "split": "right",
//           "activatePane": true,
//           "activateItem": true,
//           "pending": false,
//           "searchAllPanes": true,
//           "location": (None: option(string)),
//         };
//
//         Atom.Workspace.open_(uri, option)
//         ->Promise.Js.fromBsPromise
//         ->Promise.Js.toResult
//         ->Promise.map(
//             fun
//             | Error(_) => Error(Cancelled)
//             | Ok(_) => Ok(None),
//           );
//       };
//     } else {
//       Promise.resolved(Ok(None));
//     };
//   | GotoDefinition =>
//     if (instance.isLoaded) {
//       let name =
//         instance
//         |> restoreCursorPosition(() =>
//              Editors.getSelectedTextNode(instance.editors)
//            );
//
//       instance
//       ->getPointedGoal
//       ->Promise.flatMapOk(getGoalIndex)
//       ->Promise.flatMapOk(((_, index)) =>
//           instance |> buff(GotoDefinition(name, index))
//         )
//       ->handleOutOfGoal(_ => instance |> buff(GotoDefinitionGlobal(name)));
//     } else {
//       /* dispatch again if not already loaded  */
//       dispatch(Command.Load, instance)
//       ->handleCommandError(instance)
//       ->Promise.flatMap(_ =>
//           instance |> handleCommand(Command.GotoDefinition)
//         );
//     }
//   };
// }
//
// /* Request => Responses */
// and handleRequest =
//     (instance, handler, remote): Promise.t(result(unit, error)) =>
//   switch (remote) {
//   | None => Promise.resolved(Ok())
//   | Some(req) =>
//     let (promise, resolve) = Promise.pending();
//
//     Connections.get(instance)
//     ->Promise.tapError(_error => resolve(Error(Cancelled)))
//     ->Promise.getOk(connection => {
//         // remove all old log entries if `cmd` is `Load`
//         if (Request.isLoad(req) && connection.Connection.resetLogOnLoad) {
//           Connection.resetLog(connection);
//         };
//         // create log entry for each `cmd`
//         Log.createEntry(req.request, connection.log);
//
//         // prepare input for Agda
//         let inputForAgda = Request.toAgdaReadableString(req);
//
//         // store responses from Agda
//         let resultsOfResponseHandling = ref([]);
//         let parseErrors = ref([]);
//         open Parser.Incr.Event;
//         let onResponse = (
//           fun
//           | Ok(Yield(Ok(response))) => {
//               // feed the response to the handler
//               // the handler should return a promise which resolves on complete
//               let result =
//                 instance
//                 |> restoreCursorPosition(() => handler(instance, response));
//               resultsOfResponseHandling :=
//                 [result, ...resultsOfResponseHandling^];
//             }
//           | Ok(Yield(Error(error))) =>
//             parseErrors := [error, ...parseErrors^]
//           | Ok(Stop) =>
//             if (List.isEmpty(parseErrors^)) {
//               // no parse errors, wait until all of the response have been handled
//               (resultsOfResponseHandling^)
//               ->Promise.all
//               ->Promise.get(_results => resolve(Ok()));
//             } else {
//               resolve(Error(ParseError(Array.fromList(parseErrors^))));
//             }
//           | Error(error) =>
//             resolve(
//               Error(ConnectionError(Connection.Error.Process(error))),
//             )
//         );
//
//         let _destructor =
//           Connection.send(inputForAgda, connection).on(onResponse);
//         ();
//       });
//
//     promise;
//   }
//
// and dispatch = (command, instance): Promise.t(result(unit, error)) => {
//   handleCommand(command, instance)
//   ->Promise.tap(_ => startCheckpoint(command, instance))
//   ->Promise.flatMap(x =>
//       instance.view.updateIsPending(true)->Promise.map(() => x)
//     )
//   ->Promise.flatMapOk(handleRequest(instance, handleResponse))
//   ->Promise.tap(_ => endCheckpoint(instance))
//   ->Promise.flatMap(x =>
//       instance.view.updateIsPending(false)->Promise.map(() => x)
//     )
//   ->Promise.mapOk(_ => instance.onDispatch.emit(Ok()))
//   ->Promise.tapError(error => instance.onDispatch.emit(Error(error)));
// };
