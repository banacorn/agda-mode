open! Rebase;

open Task;
open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;
open TextEditors;

// Command => Tasks
let handle = (command: Command.t): list(Task.t) => {
  switch (command) {
  | Load => [
      Editor(Save), // force save before load
      Activate,
      WithInstance(
        instance => {
          instance.isLoaded = true;
          return([]);
        },
      ),
      Display(
        "Connecting ...",
        Type.View.Header.PlainText,
        Emacs(PlainText("")),
      ),
      SendRequest(Load),
    ]
  | Abort => [SendRequest(Abort)]
  | Quit => [
      Disconnect,
      WithInstance(
        instance => {
          instance |> Goals.destroyAll;
          instance |> Highlightings.destroyAll;
          instance.isLoaded = false;
          return([]);
        },
      ),
      Deactivate,
    ]
  | Restart => [Disconnect, SendRequest(Load)]
  | Compile => [SendRequest(Compile)]
  | ToggleDisplayOfImplicitArguments => [
      SendRequest(ToggleDisplayOfImplicitArguments),
    ]
  | SolveConstraints => [SendRequest(SolveConstraints)]
  | ShowConstraints => [SendRequest(ShowConstraints)]
  | ShowGoals => [SendRequest(ShowGoals)]
  | NextGoal => [Goals(JumpToTheNext)]
  | PreviousGoal => [Goals(JumpToThePrevious)]
  | ToggleDocking => [
      WithInstance(
        instance => instance.view.toggleDocking()->Promise.map(_ => Ok([])),
      ),
    ]
  | Give => [
      Goals(
        GetPointed(
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
      ),
    ]
  | WhyInScope => [
      WithInstance(
        instance => {
          let selectedText =
            Atom.TextEditor.getSelectedText(instance.editors.source);
          if (String.isEmpty(selectedText)) {
            return([
              Inquire(
                "Scope info",
                "name:",
                "",
                expr =>
                  [
                    Goals(
                      GetPointed(
                        ((_, index)) =>
                          [SendRequest(WhyInScope(expr, index))],
                      ),
                    ),
                  ],
              ),
            ]);
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
      Goals(
        GetPointedOr(
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
                  expr =>
                    [SendRequest(InferType(normalization, expr, index))],
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
            Goals(
              GetPointedOr(
                ((_, index)) =>
                  [SendRequest(ModuleContents(normalization, expr, index))],
                _ =>
                  [SendRequest(ModuleContentsGlobal(normalization, expr))],
              ),
            ),
          ],
      ),
    ]
  | ComputeNormalForm(computeMode) => [
      Goals(
        GetPointedOr(
          ((goal, index)) =>
            if (Goal.isEmpty(goal)) {
              [
                Inquire(
                  "Compute normal form",
                  "expression to normalize:",
                  "",
                  expr =>
                    [
                      SendRequest(
                        ComputeNormalForm(computeMode, expr, index),
                      ),
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
      ),
    ]
  | Refine => [
      Goals(
        GetPointed(
          ((goal, index)) => [SendRequest(Refine(goal, index))],
        ),
      ),
    ]

  | Auto => [
      Goals(
        GetPointed(((goal, index)) => [SendRequest(Auto(goal, index))]),
      ),
    ]
  | Case => [
      Goals(
        GetPointed(
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
      ),
    ]

  | GoalType(normalization) => [
      Goals(
        GetPointed(
          ((_, index)) => [SendRequest(GoalType(normalization, index))],
        ),
      ),
    ]
  | Context(normalization) => [
      Goals(
        GetPointed(
          ((_, index)) => [SendRequest(Context(normalization, index))],
        ),
      ),
    ]
  | GoalTypeAndContext(normalization) => [
      Goals(
        GetPointed(
          ((_, index)) =>
            [SendRequest(GoalTypeAndContext(normalization, index))],
        ),
      ),
    ]

  | GoalTypeAndInferredType(normalization) => [
      Goals(
        GetPointed(
          ((goal, index)) =>
            [
              SendRequest(
                GoalTypeAndInferredType(normalization, goal, index),
              ),
            ],
        ),
      ),
    ]
  | InputSymbol(symbol) =>
    let enabled = Atom.Config.get("agda-mode.inputMethod");
    if (enabled) {
      [
        Activate,
        WithInstance(
          instance =>
            (
              switch (symbol) {
              | Ordinary => instance.view.activateInputMethod(true)
              | CurlyBracket => instance.view.interceptAndInsertKey("{")
              | Bracket => instance.view.interceptAndInsertKey("[")
              | Parenthesis => instance.view.interceptAndInsertKey("(")
              | DoubleQuote => instance.view.interceptAndInsertKey("\"")
              | SingleQuote => instance.view.interceptAndInsertKey("'")
              | BackQuote => instance.view.interceptAndInsertKey("`")
              | Abort => instance.view.activateInputMethod(false)
              }
            )
            ->Promise.map(() => Ok([])),
        ),
      ];
    } else {
      [
        WithInstance(
          instance => {
            instance.editors
            |> Editors.Focus.get
            |> Atom.TextEditor.insertText("\\")
            |> ignore;
            Promise.resolved(Ok([]));
          },
        ),
      ];
    };
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
            restoreCursorPosition(
              () =>
                Editors.getSelectedTextNode(instance.editors)
                ->Promise.resolved,
              instance,
            )
            ->Promise.flatMap(name =>
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
