open Rebase;

/* Command Dispatcher */

type error =
  | Connection(Connection.error)
  /* Cancelled: never makes its way to Agda */
  | Cancelled
  /* Other reasons, also never make their way to Agda */
  | GoalNotIndexed
  | OutOfGoal;

type highlightingLevel =
  | None
  | NonInteractive;

module Normalization = {
  type t =
    | Simplified
    | Instantiated
    | Normalised;

  let of_string =
    fun
    | Simplified => "Simplified"
    | Instantiated => "Instantiated"
    | Normalised => "Normalised";
};

type inputSymbolType =
  | Ordinary
  | CurlyBracket
  | Bracket
  | Parenthesis
  | DoubleQuote
  | SingleQuote
  | BackQuote;

module ComputeMode = {
  type t =
    | DefaultCompute
    | IgnoreAbstract
    | UseShowInstance;

  let of_string =
    fun
    | DefaultCompute => "DefaultCompute"
    | IgnoreAbstract => "IgnoreAbstract"
    | UseShowInstance => "UseShowInstance";

  let ignoreAbstract =
    fun
    | DefaultCompute => false
    | IgnoreAbstract => true
    | UseShowInstance => true;
};

module Primitive = {
  type t =
    | Load
    | Quit
    | Restart
    | Abort
    | Compile
    | ToggleDisplayOfImplicitArguments
    | SolveConstraints
    | ShowConstraints
    | ShowGoals
    | NextGoal
    | PreviousGoal
    | ToggleDocking
    | WhyInScope
    | SearchAbout(Normalization.t)
    | InferType(Normalization.t)
    | ModuleContents(Normalization.t)
    | ComputeNormalForm(ComputeMode.t)
    | Give
    | Refine
    | Auto
    | Case
    | GoalType(Normalization.t)
    | Context(Normalization.t)
    | GoalTypeAndContext(Normalization.t)
    | GoalTypeAndInferredType(Normalization.t)
    | InputSymbol(inputSymbolType)
    | QuerySymbol
    | GotoDefinition;

  let parse =
    fun
    | "load" => Load
    | "quit" => Quit
    | "restart" => Restart
    | "abort" => Abort
    | "compile" => Compile
    | "toggle-display-of-implicit-arguments" =>
      ToggleDisplayOfImplicitArguments
    | "solve-constraints" => SolveConstraints
    | "show-constraints" => ShowConstraints
    | "show-goals" => ShowGoals
    | "next-goal" => NextGoal
    | "previous-goal" => PreviousGoal
    | "toggle-docking" => ToggleDocking
    | "why-in-scope" => WhyInScope
    | "search-about[Simplified]" => SearchAbout(Simplified)
    | "search-about[Instantiated]" => SearchAbout(Instantiated)
    | "search-about[Normalised]" => SearchAbout(Normalised)
    | "infer-type[Simplified]" => InferType(Simplified)
    | "infer-type[Instantiated]" => InferType(Instantiated)
    | "infer-type[Normalised]" => InferType(Normalised)
    | "module-contents[Simplified]" => ModuleContents(Simplified)
    | "module-contents[Instantiated]" => ModuleContents(Instantiated)
    | "module-contents[Normalised]" => ModuleContents(Normalised)
    | "compute-normal-form[DefaultCompute]" =>
      ComputeNormalForm(DefaultCompute)
    | "compute-normal-form[IgnoreAbstract]" =>
      ComputeNormalForm(IgnoreAbstract)
    | "compute-normal-form[UseShowInstance]" =>
      ComputeNormalForm(UseShowInstance)
    | "give" => Give
    | "refine" => Refine
    | "auto" => Auto
    | "case" => Case
    | "goal-type[Simplified]" => GoalType(Simplified)
    | "goal-type[Instantiated]" => GoalType(Instantiated)
    | "goal-type[Normalised]" => GoalType(Normalised)
    | "context[Simplified]" => Context(Simplified)
    | "context[Instantiated]" => Context(Instantiated)
    | "context[Normalised]" => Context(Normalised)
    | "goal-type-and-context[Simplified]" => GoalTypeAndContext(Simplified)
    | "goal-type-and-context[Instantiated]" =>
      GoalTypeAndContext(Instantiated)
    | "goal-type-and-context[Normalised]" => GoalTypeAndContext(Normalised)
    | "goal-type-and-inferred-type[Simplified]" =>
      GoalTypeAndInferredType(Simplified)
    | "goal-type-and-inferred-type[Instantiated]" =>
      GoalTypeAndInferredType(Instantiated)
    | "goal-type-and-inferred-type[Normalised]" =>
      GoalTypeAndInferredType(Normalised)
    | "input-symbol" => InputSymbol(Ordinary)
    | "input-symbol-curly-bracket" => InputSymbol(CurlyBracket)
    | "input-symbol-bracket" => InputSymbol(Bracket)
    | "input-symbol-parenthesis" => InputSymbol(Parenthesis)
    | "input-symbol-double-quote" => InputSymbol(DoubleQuote)
    | "input-symbol-single-quote" => InputSymbol(SingleQuote)
    | "input-symbol-back-quote" => InputSymbol(BackQuote)
    | "query-symbol" => QuerySymbol
    | "go-to-definition" => GotoDefinition
    | _ => Load;
  /* let triggersConnection =
     fun
     | Load
     | GotoDefinition => true
     | _ => false; */
  /* let needsConnection =
     fun
     | Quit
     | ToggleDocking
     | InputSymbol(_)
     | QuerySymbol => false
     | _ => true; */
};

/* Commands that needed to be sent to Agda */
module Remote = {
  type command =
    | Load
    | Compile
    | ToggleDisplayOfImplicitArguments
    | SolveConstraints
    | ShowConstraints
    | ShowGoals
    | WhyInScope(string, int)
    | WhyInScopeGlobal(string)
    | SearchAbout(Normalization.t, string)
    | InferType(Normalization.t, string, int)
    | InferTypeGlobal(Normalization.t, string)
    | ModuleContents(Normalization.t, string, int)
    | ModuleContentsGlobal(Normalization.t, string)
    | ComputeNormalForm(ComputeMode.t, string, int)
    | ComputeNormalFormGlobal(ComputeMode.t, string)
    | Give(Goal.t, int)
    | Refine(Goal.t, int)
    | Auto(Goal.t, int)
    | Case(Goal.t, int)
    | GoalType(Normalization.t, int)
    | Context(Normalization.t, int)
    | GoalTypeAndContext(Normalization.t, int)
    | GoalTypeAndInferredType(Normalization.t, Goal.t, int);

  type t = {
    connection: Connection.t,
    filepath: string,
    command,
  };

  /* serializes Buffed Command into strings that can be sent to Agda */
  let serialize = self => {
    let {filepath, command, connection} = self;
    let libraryPath: string = {
      let path = Atom.Environment.Config.get("agda-mode.libraryPath");
      path |> Js.Array.unshift(".") |> ignore;
      path
      |> Array.map(x => "\"" ++ Parser.filepath(x) ++ "\"")
      |> List.fromArray
      |> String.joinWith(", ");
    };
    /* highlighting method */
    let highlightingMethod =
      switch (Atom.Environment.Config.get("agda-mode.highlightingMethod")) {
      | "Direct" => "Direct"
      | _ => "Indirect"
      };
    let commonPart =
      fun
      | NonInteractive => {j|IOTCM "$(filepath)" NonInteractive $(highlightingMethod) |j}
      | None => {j|IOTCM "$(filepath)" None $(highlightingMethod) |j};

    let buildRange = goal =>
      if (Util.Semver.gte(connection.metadata.version, "2.5.1")) {
        goal |> Goal.buildHaskellRange(false, filepath);
      } else {
        goal |> Goal.buildHaskellRange(true, filepath);
      };

    /* serialization */
    switch (command) {
    | Load =>
      if (Util.Semver.gte(connection.metadata.version, "2.5.0")) {
        commonPart(NonInteractive) ++ {j|( Cmd_load "$(filepath)" [] )|j};
      } else {
        commonPart(NonInteractive)
        ++ {j|( Cmd_load "$(filepath)" [$(libraryPath)] )|j};
      }

    | Compile =>
      let backend: string = Atom.Environment.Config.get("agda-mode.backend");

      if (Util.Semver.gte(connection.metadata.version, "2.5.0")) {
        commonPart(NonInteractive)
        ++ {j|( Cmd_compile $(backend) "$(filepath)" [] )|j};
      } else {
        commonPart(NonInteractive)
        ++ {j|( Cmd_compile $(backend) "$(filepath)" [$(libraryPath)] )|j};
      };

    | ToggleDisplayOfImplicitArguments =>
      commonPart(NonInteractive) ++ {j|( ToggleImplicitArgs )|j}

    | SolveConstraints =>
      commonPart(NonInteractive) ++ {j|( Cmd_solveAll Instantiated )|j}

    | ShowConstraints =>
      commonPart(NonInteractive) ++ {j|( Cmd_constraints )|j}

    | ShowGoals => commonPart(NonInteractive) ++ {j|( Cmd_metas )|j}

    | WhyInScope(expr, index) =>
      let content = Parser.userInput(expr);

      commonPart(NonInteractive)
      ++ {j|( Cmd_why_in_scope $(index) noRange "$(content)" )|j};

    | WhyInScopeGlobal(expr) =>
      let content = Parser.userInput(expr);
      commonPart(None) ++ {j|( Cmd_why_in_scope_toplevel "$(content)" )|j};

    | SearchAbout(normalization, expr) =>
      let normalization' = Normalization.of_string(normalization);
      let content = Parser.userInput(expr);
      commonPart(None)
      ++ {j|( Cmd_search_about_toplevel $(normalization')  "$(content)" )|j};

    | InferType(normalization, expr, index) =>
      let normalization' = Normalization.of_string(normalization);
      let content = Parser.userInput(expr);

      commonPart(NonInteractive)
      ++ {j|( Cmd_infer $(normalization') $(index) noRange "$(content)" )|j};

    | InferTypeGlobal(normalization, expr) =>
      let normalization' = Normalization.of_string(normalization);
      let content = Parser.userInput(expr);

      commonPart(None)
      ++ {j|( Cmd_infer_toplevel $(normalization') "$(content)" )|j};

    | ModuleContents(normalization, expr, index) =>
      let normalization' = Normalization.of_string(normalization);
      let content = Parser.userInput(expr);

      commonPart(NonInteractive)
      ++ {j|( Cmd_show_module_contents $(normalization') $(index) noRange "$(content)" )|j};

    | ModuleContentsGlobal(normalization, expr) =>
      let normalization' = Normalization.of_string(normalization);
      let content = Parser.userInput(expr);

      commonPart(None)
      ++ {j|( Cmd_show_module_contents_toplevel $(normalization') "$(content)" )|j};

    | ComputeNormalForm(computeMode, expr, index) =>
      let computeMode' = ComputeMode.of_string(computeMode);
      let ignoreAbstract = ComputeMode.ignoreAbstract(computeMode);
      let content = Parser.userInput(expr);

      if (Util.Semver.gte(connection.metadata.version, "2.5.2")) {
        commonPart(NonInteractive)
        ++ {j|( Cmd_compute $(computeMode') $(index) noRange "$(content)" )|j};
      } else {
        commonPart(NonInteractive)
        ++ {j|( Cmd_compute $(ignoreAbstract) $(index) noRange "$(content)" )|j};
      };

    | ComputeNormalFormGlobal(computeMode, expr) =>
      let computeMode' = ComputeMode.of_string(computeMode);
      let ignoreAbstract = ComputeMode.ignoreAbstract(computeMode);
      let content = Parser.userInput(expr);

      if (Util.Semver.gte(connection.metadata.version, "2.5.2")) {
        commonPart(NonInteractive)
        ++ {j|( Cmd_compute_toplevel $(computeMode') "$(content)" )|j};
      } else {
        commonPart(NonInteractive)
        ++ {j|( Cmd_compute_toplevel $(ignoreAbstract) "$(content)" )|j};
      };

    /* Related issue and commit of agda/agda */
    /* https://github.com/agda/agda/issues/2730 */
    /* https://github.com/agda/agda/commit/021e6d24f47bac462d8bc88e2ea685d6156197c4 */
    | Give(goal, index) =>
      let content = Goal.getContent(goal);
      let range = buildRange(goal);
      if (Util.Semver.gte(connection.metadata.version, "2.5.3")) {
        commonPart(NonInteractive)
        ++ {j|( Cmd_give WithoutForce $(index) $(range) "$(content)" )|j};
      } else {
        commonPart(NonInteractive)
        ++ {j|( Cmd_give $(index) $(range) "$(content)" )|j};
      };

    | Refine(goal, index) =>
      let content = Goal.getContent(goal);
      let range = buildRange(goal);
      commonPart(NonInteractive)
      ++ {j|( Cmd_refine_or_intro False $(index) $(range) "$(content)" )|j};

    | Auto(goal, index) =>
      let content = Goal.getContent(goal);
      let range = buildRange(goal);
      commonPart(NonInteractive)
      ++ {j|( Cmd_auto $(index) $(range) "$(content)" )|j};

    | Case(goal, index) =>
      let content = Goal.getContent(goal);
      let range = buildRange(goal);
      commonPart(NonInteractive)
      ++ {j|( Cmd_make_case $(index) $(range) "$(content)" )|j};

    | GoalType(normalization, index) =>
      let normalization' = Normalization.of_string(normalization);
      commonPart(NonInteractive)
      ++ {j|( Cmd_goal_type $(normalization') $(index) noRange "" )|j};

    | Context(normalization, index) =>
      let normalization' = Normalization.of_string(normalization);
      commonPart(NonInteractive)
      ++ {j|( Cmd_context $(normalization') $(index) noRange "" )|j};

    | GoalTypeAndContext(normalization, index) =>
      let normalization' = Normalization.of_string(normalization);
      commonPart(NonInteractive)
      ++ {j|( Cmd_goal_type_context $(normalization') $(index) noRange "" )|j};

    | GoalTypeAndInferredType(normalization, goal, index) =>
      let content = Goal.getContent(goal);
      let normalization' = Normalization.of_string(normalization);
      commonPart(NonInteractive)
      ++ {j|( Cmd_goal_type_context_infer $(normalization') $(index) noRange "$(content)" )|j};
    };
  };
};

let names = [|
  "load",
  "quit",
  "restart",
  "abort",
  "compile",
  "toggle-display-of-implicit-arguments",
  "solve-constraints",
  "show-constraints",
  "show-goals",
  "next-goal",
  "previous-goal",
  "toggle-docking",
  "why-in-scope",
  "search-about[Simplified]",
  "search-about[Instantiated]",
  "search-about[Normalised]",
  "infer-type[Simplified]",
  "infer-type[Instantiated]",
  "infer-type[Normalised]",
  "module-contents[Simplified]",
  "module-contents[Instantiated]",
  "module-contents[Normalised]",
  "compute-normal-form[DefaultCompute]",
  "compute-normal-form[IgnoreAbstract]",
  "compute-normal-form[UseShowInstance]",
  "give",
  "refine",
  "auto",
  "case",
  "goal-type[Simplified]",
  "goal-type[Instantiated]",
  "goal-type[Normalised]",
  "context[Simplified]",
  "context[Instantiated]",
  "context[Normalised]",
  "goal-type-and-context[Simplified]",
  "goal-type-and-context[Instantiated]",
  "goal-type-and-context[Normalised]",
  "goal-type-and-inferred-type[Simplified]",
  "goal-type-and-inferred-type[Instantiated]",
  "goal-type-and-inferred-type[Normalised]",
  "input-symbol",
  "input-symbol-curly-bracket",
  "input-symbol-bracket",
  "input-symbol-parenthesis",
  "input-symbol-double-quote",
  "input-symbol-single-quote",
  "input-symbol-back-quote",
  "query-symbol",
  "go-to-definition",
|];
