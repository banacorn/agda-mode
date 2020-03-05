open! Rebase;

open Task;
open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;
open TextEditors;

// Command => Request
let handle = (command: Command.t): list(Task.t) => {
  switch (command) {
  | Load => [
      WithInstance(
        instance =>
          // force save before load
          instance.editors.source
          ->Atom.TextEditor.save
          ->Promise.Js.fromBsPromise
          ->Promise.Js.toResult
          ->Promise.mapError(_ => Cancelled)
          // activate the view
          ->Promise.flatMapOk(() => {
              instance.isLoaded = true;
              // display the placeholder
              instance.view.activate()
              ->Promise.flatMap(_ =>
                  instance.view.display(
                    "Connecting ...",
                    Type.View.Header.PlainText,
                    Emacs(PlainText("")),
                  )
                )
              ->Promise.map(_ => Ok([SendRequest(Load)]));
            }),
      ),
    ]
  | Abort => [SendRequest(Abort)]
  | Quit => [
      WithInstance(
        instance =>
          Connections.disconnect(instance)
          ->Promise.flatMap(_ => {
              instance |> Goals.destroyAll;
              instance |> Highlightings.destroyAll;
              instance.view.deactivate();
            })
          ->Promise.flatMap(_ => {
              instance.isLoaded = false;
              instance.view.deactivate();
            })
          ->Promise.map(_ => Ok([])),
      ),
    ]
  | Restart => [
      WithInstance(
        instance =>
          Connections.disconnect(instance)->Promise.map(() => Ok([])),
      ),
      SendRequest(Load),
    ]
  | Compile => [SendRequest(Compile)]
  | ToggleDisplayOfImplicitArguments => [
      SendRequest(ToggleDisplayOfImplicitArguments),
    ]
  | SolveConstraints => [SendRequest(SolveConstraints)]
  | ShowConstraints => [SendRequest(ShowConstraints)]
  | ShowGoals => [SendRequest(ShowGoals)]
  | NextGoal => [
      WithInstance(
        instance => {
          Goals.getNextGoalPosition(instance)
          |> Option.forEach(position =>
               instance.editors.source
               |> Atom.TextEditor.setCursorBufferPosition(position)
             );
          return([]);
        },
      ),
    ]
  | PreviousGoal => [
      WithInstance(
        instance => {
          Goals.getPreviousGoalPosition(instance)
          |> Option.forEach(position =>
               instance.editors.source
               |> Atom.TextEditor.setCursorBufferPosition(position)
             );
          return([]);
        },
      ),
    ]

  | ToggleDocking => [
      WithInstance(
        instance => instance.view.toggleDocking()->Promise.map(_ => Ok([])),
      ),
    ]
  | Give => [
      GetPointedGoal(
        ((goal, index)) =>
          if (Goal.isEmpty(goal)) {
            [
              Inquire(
                "Give",
                "expression to give:",
                "",
                expr => {
                  Goal.setContent(expr, goal) |> ignore;
                  [SendRequest(Give(goal, index))];
                },
              ),
            ];
          } else {
            [SendRequest(Give(goal, index))];
          },
      ),
    ]
  | WhyInScope => [
      WithInstance(
        instance => {
          let selectedText =
            Atom.TextEditor.getSelectedText(instance.editors.source);
          if (String.isEmpty(selectedText)) {
            instance.view.inquire("Scope info", "name:", "")
            ->Promise.mapError(_ => Cancelled)
            ->Promise.flatMapOk(expr =>
                instance
                ->getPointedGoal
                ->Promise.flatMapOk(getGoalIndex)
                ->Promise.mapOk(((_, index)) =>
                    [SendRequest(WhyInScope(expr, index))]
                  )
              );
          } else {
            return([SendRequest(WhyInScopeGlobal(selectedText))]);
          };
        },
      ),
    ]

  | SearchAbout(normalization) => [
      Inquire(
        "Searching through definitions ["
        ++ Command.Normalization.toString(normalization)
        ++ "]",
        "expression to search:",
        "",
        expr => [SendRequest(SearchAbout(normalization, expr))],
      ),
    ]
  | InferType(normalization) => [
      GetPointedGoalOr(
        ((goal, index)) =>
          if (Goal.isEmpty(goal)) {
            [
              // goal-specific
              Inquire(
                "Infer type ["
                ++ Command.Normalization.toString(normalization)
                ++ "]",
                "expression to infer:",
                "",
                expr => [SendRequest(SearchAbout(normalization, expr))],
              ),
            ];
          } else {
            // global
            let expr = Goal.getContent(goal);
            [SendRequest(InferType(normalization, expr, index))];
          },
        () =>
          [
            Inquire(
              "Infer type ["
              ++ Command.Normalization.toString(normalization)
              ++ "]",
              "expression to infer:",
              "",
              expr => [SendRequest(InferTypeGlobal(normalization, expr))],
            ),
          ],
      ),
    ]

  | ModuleContents(normalization) => [
      Inquire(
        "Module contents ["
        ++ Command.Normalization.toString(normalization)
        ++ "]",
        "module name:",
        "",
        expr =>
          [
            GetPointedGoalOr(
              ((_, index)) =>
                [SendRequest(ModuleContents(normalization, expr, index))],
              _ => [SendRequest(ModuleContentsGlobal(normalization, expr))],
            ),
          ],
      ),
    ]
  | ComputeNormalForm(computeMode) => [
      GetPointedGoalOr(
        ((goal, index)) =>
          if (Goal.isEmpty(goal)) {
            [
              Inquire(
                "Compute normal form",
                "expression to normalize:",
                "",
                expr =>
                  [
                    SendRequest(ComputeNormalForm(computeMode, expr, index)),
                  ],
              ),
            ];
          } else {
            let expr = Goal.getContent(goal);
            [SendRequest(ComputeNormalForm(computeMode, expr, index))];
          },
        _ =>
          [
            Inquire(
              "Compute normal form",
              "expression to normalize:",
              "",
              expr =>
                [SendRequest(ComputeNormalFormGlobal(computeMode, expr))],
            ),
          ],
      ),
    ]
  | Refine => [
      GetPointedGoal(
        ((goal, index)) => [SendRequest(Refine(goal, index))],
      ),
    ]

  | Auto => [
      GetPointedGoal(
        ((goal, index)) => [SendRequest(Auto(goal, index))],
      ),
    ]
  | Case => [
      GetPointedGoal(
        ((goal, index)) =>
          if (Goal.isEmpty(goal)) {
            [
              Inquire(
                "Case",
                "expression to case:",
                "",
                expr => {
                  Goal.setContent(expr, goal) |> ignore;
                  [SendRequest(Case(goal, index))];
                },
              ),
            ];
          } else {
            [SendRequest(Case(goal, index))];
          },
      ),
    ]

  | GoalType(normalization) => [
      GetPointedGoal(
        ((_, index)) => [SendRequest(GoalType(normalization, index))],
      ),
    ]
  | Context(normalization) => [
      GetPointedGoal(
        ((_, index)) => [SendRequest(Context(normalization, index))],
      ),
    ]
  | GoalTypeAndContext(normalization) => [
      GetPointedGoal(
        ((_, index)) =>
          [SendRequest(GoalTypeAndContext(normalization, index))],
      ),
    ]

  | GoalTypeAndInferredType(normalization) => [
      GetPointedGoal(
        ((goal, index)) =>
          [
            SendRequest(GoalTypeAndInferredType(normalization, goal, index)),
          ],
      ),
    ]
  | InputSymbol(symbol) => [
      WithInstance(
        instance => {
          let enabled = Atom.Config.get("agda-mode.inputMethod");
          if (enabled) {
            instance.view.activate()
            ->Promise.flatMap(_ =>
                switch (symbol) {
                | Ordinary =>
                  instance.view.activate()
                  ->Promise.flatMap(_ =>
                      instance.view.activateInputMethod(true)
                    )
                | CurlyBracket => instance.view.interceptAndInsertKey("{")
                | Bracket => instance.view.interceptAndInsertKey("[")
                | Parenthesis => instance.view.interceptAndInsertKey("(")
                | DoubleQuote => instance.view.interceptAndInsertKey("\"")
                | SingleQuote => instance.view.interceptAndInsertKey("'")
                | BackQuote => instance.view.interceptAndInsertKey("`")
                | Abort => instance.view.activateInputMethod(false)
                }
              )
            ->Promise.map(_ => Ok([]));
          } else {
            instance.editors
            |> Editors.Focus.get
            |> Atom.TextEditor.insertText("\\")
            |> ignore;
            Promise.resolved(Ok([]));
          };
        },
      ),
    ]

  | QuerySymbol => [
      WithInstance(
        instance => {
          let selected = instance.editors |> Editors.getSelectedSymbol;
          let getSymbol =
            if (String.isEmpty(String.trim(selected))) {
              instance.view.activate()
              ->Promise.flatMap(_ =>
                  instance.view.inquire(
                    "Lookup Unicode Symbol Input Sequence",
                    "symbol to lookup:",
                    "",
                  )
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
          Promise.resolved(Ok([]));
        },
      ),
    ]
  | Jump(Type.Location.Range.HoleLink(index)) => [
      WithInstance(
        instance => {
          let positions = instance |> Goals.getPositions;

          instance.editors |> Editors.Focus.on(Source);
          positions[index]
          |> Option.forEach(position =>
               instance.editors.source
               |> Atom.TextEditor.setCursorBufferPosition(position)
             );
          Promise.resolved(Ok([]));
        },
      ),
    ]
  | Jump(Type.Location.Range.RangeLink(range)) => [
      WithInstance(
        instance => {
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
              Promise.resolved(Ok([]));
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
                  | Ok(_) => Ok([]),
                );
            };
          } else {
            Promise.resolved(Ok([]));
          };
        },
      ),
    ]
  | GotoDefinition => [
      WithInstance(
        instance =>
          if (instance.isLoaded) {
            let name =
              instance
              |> updateCursorPosition(() =>
                   Editors.getSelectedTextNode(instance.editors)
                 );

            instance
            ->getPointedGoal
            ->Promise.flatMapOk(getGoalIndex)
            ->Promise.mapOk(((_, index)) =>
                [SendRequest(GotoDefinition(name, index))]
              )
            ->handleOutOfGoal(_ =>
                Promise.resolved(
                  Ok([SendRequest(GotoDefinitionGlobal(name))]),
                )
              );
          } else {
            // dispatch again if not already loaded
            Promise.resolved(
              Ok([DispatchCommand(Command.Load)]),
            );
          },
      ),
    ]
  };
};
