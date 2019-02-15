open Rebase;

/* https://github.com/agda/agda/blob/master/src/full/Agda/Interaction/Response.hs */

type filepath = string;
type index = int;

module Event = Util.Event;
module Token = Emacs.Parser.SExpression;

/* type fileType =
   | Agda
   | LiterateTeX
   | LiterateReStructuredText
   | LiterateMarkdown; */

type giveResult =
  | Paren
  | NoParen
  | String(string);

type makeCaseType =
  | Function
  | ExtendedLambda;

module Info = {
  type t =
    | CompilationOk
    | Constraints(option(string))
    | AllGoalsWarnings(Type.View.Emacs.allGoalsWarnings)
    | Time(string)
    | Error(string)
    | Intro(string)
    | Auto(string)
    | ModuleContents(string)
    | SearchAbout(string)
    | WhyInScope(string)
    | NormalForm(string)
    | GoalType(string)
    | CurrentGoal(string)
    | InferredType(string)
    | Context(string)
    | HelperFunction(string)
    | Version(string);

  let parse = (xs: array(Token.t)): option(t) => {
    switch (xs[1]) {
    | Some(A(rawPayload)) =>
      let payload =
        rawPayload |> Js.String.replaceByRe([%re "/\\\\r\\\\n|\\\\n/g"], "\n");
      switch (xs[0]) {
      | Some(A("*Compilation result*")) => Some(CompilationOk)
      | Some(A("*Constraints*")) =>
        switch (payload) {
        | "nil" => Some(Constraints(None))
        | _ => Some(Constraints(Some(payload)))
        }
      | Some(A("*Helper function*")) => Some(HelperFunction(payload))
      | Some(A("*Error*")) => Some(Error(payload))
      | Some(A("*Auto*")) => Some(Auto(payload))
      | Some(A("*Time*")) => Some(Time(payload))
      | Some(A("*Normal Form*")) => Some(NormalForm(payload))
      | Some(A("*Search About*")) => Some(SearchAbout(payload))
      | Some(A("*Inferred Type*")) => Some(InferredType(payload))
      | Some(A("*Current Goal*")) => Some(CurrentGoal(payload))
      | Some(A("*Goal type etc.*")) => Some(GoalType(payload))
      | Some(A("*Module contents*")) => Some(ModuleContents(payload))
      | Some(A("*Scope Info*")) => Some(WhyInScope(payload))
      | Some(A("*Context*")) => Some(Context(payload))
      | Some(A("*Intro*")) => Some(Intro(payload))
      | Some(A("*Agda Version*")) => Some(Version(payload))
      | Some(A(title)) =>
        Some(
          AllGoalsWarnings(
            Emacs.Parser.Response.allGoalsWarnings(title, payload),
          ),
        )
      | _ => None
      };
    | _ => None
    };
  };

  let handle = (instance: Instance.t, info: t) => {
    open Type.View;

    let updateView = (header, body) => {
      instance.view.updateHeader |> Event.resolve(header);
      instance.view.updateBody |> Event.resolve(body);
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
      updateView(
        {text: "Error", style: Header.Error},
        Emacs(Error(payload)),
      )
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
};

type t =
  /* agda2-highlight-add-annotations */
  | HighlightingInfoDirect(
      Highlighting.removeTokenBasedHighlighting,
      array(Highlighting.Annotation.t),
    )
  /* agda2-highlight-load-and-delete-action */
  | HighlightingInfoIndirect(filepath)
  /* agda2-status-action */
  | Status(
      bool, /*  Are implicit arguments displayed? */
      /* Has the module been successfully type checked? */
      bool,
    )
  /* agda2-maybe-goto */
  | JumpToError(filepath, int)
  /* agda2-goals-action */
  | InteractionPoints(array(index))
  /* agda2-give-action */
  | GiveAction(index, giveResult)
  /* agda2-make-case-action */
  /* agda2-make-case-action-extendlam */
  | MakeCase(makeCaseType, array(string))
  /* agda2-solveAll-action */
  | SolveAll(array((index, string)))
  /* agda2-info-action */
  /* agda2-info-action-and-copy */
  | DisplayInfo(Info.t)
  | ClearRunningInfo
  /* agda2-verbose */
  | RunningInfo(int, string)
  /* agda2-highlight-clear */
  | ClearHighlighting
  /* agda2-abort-done */
  | DoneAborting;

let parse = (tokens: Token.t): result(t, string) => {
  let err = Error(tokens |> Token.toString);
  switch (tokens) {
  | A(_) => err
  | L(xs) =>
    switch (xs[0]) {
    | Some(A("agda2-highlight-add-annotations")) =>
      let annotations = Highlighting.Annotation.parseDirectHighlighting(xs);
      switch (xs[1]) {
      | Some(A("remove")) =>
        Ok(HighlightingInfoDirect(Highlighting.Remove, annotations))
      | Some(A("nil")) =>
        Ok(HighlightingInfoDirect(Highlighting.Keep, annotations))
      | _ => err
      };
    | Some(A("agda2-highlight-load-and-delete-action")) =>
      switch (xs[1]) {
      | Some(A(filepath)) => Ok(HighlightingInfoIndirect(filepath))
      | _ => err
      }
    | Some(A("agda2-status-action")) =>
      switch (xs[1]) {
      | Some(A(status)) =>
        let pulp = status |> Js.String.split(",");
        Ok(
          Status(
            pulp |> Js.Array.includes("ShowImplicit"),
            pulp |> Js.Array.includes("Checked"),
          ),
        );
      | _ => err
      }
    | Some(A("agda2-maybe-goto")) =>
      switch (xs[1]) {
      | Some(L([|A(filepath), _, A(index)|])) =>
        Ok(JumpToError(filepath, int_of_string(index)))
      | _ => err
      }
    | Some(A("agda2-goals-action")) =>
      switch (xs[1]) {
      | Some(xs) =>
        Ok(
          InteractionPoints(xs |> Token.flatten |> Array.map(int_of_string)),
        )
      | _ => err
      }
    | Some(A("agda2-give-action")) =>
      switch (xs[1]) {
      | Some(A(index)) =>
        let i = int_of_string(index);
        switch (xs[2]) {
        | Some(A("paren")) => Ok(GiveAction(i, Paren))
        | Some(A("no-paren")) => Ok(GiveAction(i, NoParen))
        | Some(A(result)) => Ok(GiveAction(i, String(result)))
        | Some(L(_)) => err
        | _ => err
        };
      | _ => err
      }
    | Some(A("agda2-make-case-action")) =>
      switch (xs[1]) {
      | Some(xs) => Ok(MakeCase(Function, Token.flatten(xs)))
      | _ => err
      }
    | Some(A("agda2-make-case-action-extendlam")) =>
      switch (xs[1]) {
      | Some(xs) => Ok(MakeCase(ExtendedLambda, Token.flatten(xs)))
      | _ => err
      }
    | Some(A("agda2-solveAll-action")) =>
      switch (xs[1]) {
      | Some(xs) =>
        let tokens = Token.flatten(xs);

        let isEven = i =>
          Int32.rem(Int32.of_int(i), Int32.of_int(2)) == Int32.of_int(0);

        let i = ref(0);
        let solutions =
          tokens
          |> Array.filterMap(token => {
               let solution =
                 if (isEven(i^)) {
                   let index = int_of_string(token);
                   tokens[i^ + 1] |> Option.map(s => (index, s));
                   /* switch (tokens[i^ + 1]) {
                      | Some(solution) => result
                      | None =>
                      }; */
                 } else {
                   None;
                 };
               /* loop index */
               i := i^ + 1;
               /* return the solution */
               solution;
             });
        Ok(SolveAll(solutions));
      | _ => err
      }
    | Some(A("agda2-info-action"))
    | Some(A("agda2-info-action-and-copy")) =>
      switch (xs[1]) {
      | Some(A("*Type-checking*")) =>
        switch (xs[3]) {
        /* t: append */
        | Some(A("t")) =>
          switch (xs[2]) {
          | Some(A(message)) => Ok(RunningInfo(1, message))
          | _ => err
          }
        | _ => Ok(ClearRunningInfo)
        }
      | _ =>
        switch (Info.parse(xs |> Js.Array.sliceFrom(1))) {
        | Some(info) => Ok(DisplayInfo(info))
        | None => err
        }
      }
    | Some(A("agda2-verbose")) =>
      switch (xs[2]) {
      | Some(A(message)) => Ok(RunningInfo(2, message))
      | _ => err
      }
    | Some(A("agda2-highlight-clear")) => Ok(ClearHighlighting)
    | Some(A("agda2-abort-done")) => Ok(DoneAborting)
    | _ => err
    }
  };
};

let handle = (instance: Instance.t, response: t) => {
  open Util.Promise;
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
    |> Array.forEach(annotation =>
         instance |> Instance.Highlightings.add(annotation)
       )
  | HighlightingInfoIndirect(filepath) =>
    instance
    |> Instance.Highlightings.addFromFile(filepath)
    |> finally(() => N.Fs.unlink(filepath, _ => ()) |> ignore)
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
    }
  | JumpToError(targetFilePath, index) =>
    if (targetFilePath == filePath) {
      let point =
        textBuffer |> Atom.TextBuffer.positionForCharacterIndex(index - 1);
      textEditor |> Atom.TextEditor.setCursorBufferPosition(point);
    }
  | InteractionPoints(indices) =>
    instance |> Instance.Goals.instantiateAll(indices)
  | GiveAction(index, give) =>
    switch (Instance.Goals.find(index, instance)) {
    | None => ()
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
    }
  | MakeCase(makeCaseType, lines) =>
    let pointed = Editors.pointingAt(instance.goals, instance.editors);
    switch (pointed) {
    | Some(goal) =>
      switch (makeCaseType) {
      | Function => Goal.writeLines(lines, goal)
      | ExtendedLambda => Goal.writeLambda(lines, goal)
      }
    /* instance |> Instance.dispatch(Load); */
    | None =>
      Type.View.(
        updateView(
          {text: "Out of goal", style: Header.Error},
          Emacs(
            PlainText(
              "`Case` is a goal-specific command, please place the cursor in a goal",
            ),
          ),
        )
      )
      |> ignore
    };
  | DisplayInfo(info) =>
    instance.view.activatePanel |> Event.resolve(true);
    Info.handle(instance, info);
  | ClearHighlighting => instance |> Instance.Highlightings.destroyAll
  | _ => Js.log(response)
  };
};

/* type t =
   /* agda2-make-case-action */
   /* agda2-make-case-action-extendlam */
   | MakeCase(makeCaseType, array(string))
   /* agda2-solveAll-action */
   | SolveAll(array((index, string)))
   /* agda2-info-action */
   /* agda2-info-action-and-copy */
   | DisplayInfo(Info.t)
   | ClearRunningInfo
   /* agda2-verbose */
   | RunningInfo(int, string)
   /* agda2-highlight-clear */
   | ClearHighlighting
   /* agda2-abort-done */
   | DoneAborting; */
