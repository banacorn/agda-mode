open! Rebase;

open Task;
open Instance__Type;

module Goals = Instance__Goals;
module Highlightings = Instance__Highlightings;
module Connections = Instance__Connections;
module TextEditors = Instance__TextEditors;
open TextEditors;

// Response => Task
let handle = (response: Response.t): list(Task.t) =>
  switch (response) {
  | HighlightingInfoDirect(_remove, annotations) => [
      WithInstance(
        instance => {
          annotations
          |> Array.filter(Highlighting.Annotation.shouldHighlight)
          |> Array.forEach(annotation =>
               instance |> Highlightings.add(annotation)
             );
          return([]);
        },
      ),
    ]
  | HighlightingInfoIndirect(filepath) => [
      WithInstance(
        instance =>
          Highlightings.addFromFile(filepath, instance)
          ->Promise.map(() => Ok(N.Fs.unlink(filepath, _ => ())))
          ->Promise.map(_ => Ok([])),
      ),
    ]

  | Status(displayImplicit, checked) =>
    if (displayImplicit || checked) {
      [
        Display(
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
        ),
      ];
    } else {
      [];
    }
  | JumpToError(targetFilePath, index) => [
      WithInstance(
        instance =>
          // see if the error is on the same file
          if (targetFilePath == Instance__TextEditors.getPath(instance)) {
            let point =
              instance.editors.source
              |> Atom.TextEditor.getBuffer
              |> Atom.TextBuffer.positionForCharacterIndex(index - 1);

            Promise.exec(resolve =>
              Js.Global.setTimeout(
                () => {
                  Atom.TextEditor.setCursorBufferPosition(
                    point,
                    instance.editors.source,
                  );
                  resolve();
                  ();
                },
                0,
              )
              |> ignore
            )
            ->Promise.map(() => Ok([]));
          } else {
            return([]);
          },
      ),
    ]
  | InteractionPoints(indices) => [
      WithInstance(
        instance => {
          instance |> Goals.instantiateAll(indices);
          return([]);
        },
      ),
    ]
  | GiveAction(index, give) => [
      WithInstance(
        instance =>
          switch (Goals.find(index, instance)) {
          | None =>
            Js.log("error: cannot find goal #" ++ string_of_int(index));
            return([]);
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
            return([]);
          },
      ),
    ]
  | MakeCase(makeCaseType, lines) => [
      WithInstance(
        instance => {
          let pointed = pointingAt(instance);
          switch (pointed) {
          | Some(goal) =>
            switch (makeCaseType) {
            | Function => Goal.writeLines(lines, goal)
            | ExtendedLambda => Goal.writeLambda(lines, goal)
            };
            return([DispatchCommand(Load)]);
          | None => Promise.resolved(Error(OutOfGoal))
          };
        },
      ),
    ]
  | DisplayInfo(info) => Task__DisplayInfo.handle(info)
  | ClearHighlighting => [
      WithInstance(
        instance => {
          instance |> Highlightings.destroyAll;
          return([]);
        },
      ),
    ]
  | NoStatus => []
  | RunningInfo(verbosity, message) =>
    if (verbosity >= 2) {
      [
        WithInstance(
          instance => {
            instance.runningInfo
            |> RunningInfo.add(Parser.agdaOutput(message))
            |> ignore;
            return([]);
          },
        ),
      ];
    } else {
      [
        Display(
          "Type-checking",
          Type.View.Header.PlainText,
          Emacs(PlainText(message)),
        ),
      ];
    }
  | ClearRunningInfo => []
  | DoneAborting => [
      Display(
        "Status",
        Type.View.Header.Warning,
        Emacs(PlainText("Done aborting")),
      ),
    ]
  | SolveAll(solutions) => [
      WithInstance(
        instance => {
          let solve = ((index, solution)) => {
            switch (Goals.find(index, instance)) {
            | None => []
            | Some(goal) =>
              Goal.setContent(solution, goal) |> ignore;
              Goals.setCursor(goal, instance);
              [DispatchCommand(Give)];
            };
          };

          // solve them one by one
          let tasks = solutions |> List.fromArray |> List.flatMap(solve);
          let size = Array.length(solutions);
          let after =
            if (size == 0) {
              [
                Display(
                  "No solutions found",
                  Type.View.Header.PlainText,
                  Emacs(PlainText("")),
                ),
              ];
            } else {
              [
                Display(
                  string_of_int(size) ++ " goals solved",
                  Type.View.Header.Success,
                  Emacs(PlainText("")),
                ),
              ];
            };
          return(List.concat(tasks, after));
        },
      ),
    ]
  };
