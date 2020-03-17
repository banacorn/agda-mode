open Rebase;

open Command;

/* Requests to Agda */
type t =
  | Load
  | Abort
  | Compile
  | ToggleDisplayOfImplicitArguments
  | SolveConstraints
  | ShowConstraints
  | ShowGoals
  | WhyInScope(string, Goal.t)
  | WhyInScopeGlobal(string)
  | SearchAbout(Normalization.t, string)
  | InferType(Normalization.t, string, Goal.t)
  | InferTypeGlobal(Normalization.t, string)
  | ModuleContents(Normalization.t, string, Goal.t)
  | ModuleContentsGlobal(Normalization.t, string)
  | ComputeNormalForm(ComputeMode.t, string, Goal.t)
  | ComputeNormalFormGlobal(ComputeMode.t, string)
  | Give(Goal.t)
  | Refine(Goal.t)
  | Auto(Goal.t)
  | Case(Goal.t)
  | GoalType(Normalization.t, Goal.t)
  | Context(Normalization.t, Goal.t)
  | GoalTypeAndContext(Normalization.t, Goal.t)
  | GoalTypeAndInferredType(Normalization.t, Goal.t)
  | GotoDefinition(string, Goal.t)
  | GotoDefinitionGlobal(string);

/* serializes Buffed Command into strings that can be sent to Agda */
let toAgdaReadableString = (version, filepath, request) => {
  let libraryPath: string = {
    let path = Atom.Config.get("agda-mode.libraryPath");
    path |> Js.Array.unshift(".") |> ignore;
    path
    |> Array.map(x => "\"" ++ Parser.filepath(x) ++ "\"")
    |> List.fromArray
    |> String.joinWith(", ");
  };
  /* highlighting method */
  let highlightingMethod =
    switch (Atom.Config.get("agda-mode.highlightingMethod")) {
    | "Direct" => "Direct"
    | _ => "Indirect"
    };
  let commonPart =
    fun
    | NonInteractive => {j|IOTCM "$(filepath)" NonInteractive $(highlightingMethod) |j}
    | None' => {j|IOTCM "$(filepath)" None $(highlightingMethod) |j};

  let buildRange = goal =>
    if (Util.Version.gte(version, "2.5.1")) {
      goal |> Goal.buildHaskellRange(false, filepath);
    } else {
      goal |> Goal.buildHaskellRange(true, filepath);
    };

  /* serialization */
  switch (request) {
  | Load =>
    if (Util.Version.gte(version, "2.5.0")) {
      commonPart(NonInteractive) ++ {j|( Cmd_load "$(filepath)" [] )|j};
    } else {
      commonPart(NonInteractive)
      ++ {j|( Cmd_load "$(filepath)" [$(libraryPath)] )|j};
    }
  | Abort => commonPart(NonInteractive) ++ {j|( Cmd_abort )|j}

  | Compile =>
    let backend: string = Atom.Config.get("agda-mode.backend");

    if (Util.Version.gte(version, "2.5.0")) {
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

  | ShowConstraints => commonPart(NonInteractive) ++ {j|( Cmd_constraints )|j}

  | ShowGoals => commonPart(NonInteractive) ++ {j|( Cmd_metas )|j}

  | WhyInScope(expr, goal) =>
    let index = goal.index;
    let content = Parser.userInput(expr);

    commonPart(NonInteractive)
    ++ {j|( Cmd_why_in_scope $(index) noRange "$(content)" )|j};

  | WhyInScopeGlobal(expr) =>
    let content = Parser.userInput(expr);
    commonPart(None') ++ {j|( Cmd_why_in_scope_toplevel "$(content)" )|j};

  | SearchAbout(normalization, expr) =>
    let normalization' = Normalization.toString(normalization);
    let content = Parser.userInput(expr);
    commonPart(None')
    ++ {j|( Cmd_search_about_toplevel $(normalization')  "$(content)" )|j};

  | InferType(normalization, expr, index) =>
    let normalization' = Normalization.toString(normalization);
    let content = Parser.userInput(expr);

    commonPart(NonInteractive)
    ++ {j|( Cmd_infer $(normalization') $(index) noRange "$(content)" )|j};

  | InferTypeGlobal(normalization, expr) =>
    let normalization' = Normalization.toString(normalization);
    let content = Parser.userInput(expr);

    commonPart(None')
    ++ {j|( Cmd_infer_toplevel $(normalization') "$(content)" )|j};

  | ModuleContents(normalization, expr, goal) =>
    let index = goal.index;
    let normalization' = Normalization.toString(normalization);
    let content = Parser.userInput(expr);

    commonPart(NonInteractive)
    ++ {j|( Cmd_show_module_contents $(normalization') $(index) noRange "$(content)" )|j};

  | ModuleContentsGlobal(normalization, expr) =>
    let normalization' = Normalization.toString(normalization);
    let content = Parser.userInput(expr);

    commonPart(None')
    ++ {j|( Cmd_show_module_contents_toplevel $(normalization') "$(content)" )|j};

  | ComputeNormalForm(computeMode, expr, goal) =>
    let index = goal.index;
    let computeMode' = ComputeMode.toString(computeMode);
    let ignoreAbstract = ComputeMode.ignoreAbstract(computeMode);
    let content = Parser.userInput(expr);

    if (Util.Version.gte(version, "2.5.2")) {
      commonPart(NonInteractive)
      ++ {j|( Cmd_compute $(computeMode') $(index) noRange "$(content)" )|j};
    } else {
      commonPart(NonInteractive)
      ++ {j|( Cmd_compute $(ignoreAbstract) $(index) noRange "$(content)" )|j};
    };

  | ComputeNormalFormGlobal(computeMode, expr) =>
    let computeMode' = ComputeMode.toString(computeMode);
    let ignoreAbstract = ComputeMode.ignoreAbstract(computeMode);
    let content = Parser.userInput(expr);

    if (Util.Version.gte(version, "2.5.2")) {
      commonPart(NonInteractive)
      ++ {j|( Cmd_compute_toplevel $(computeMode') "$(content)" )|j};
    } else {
      commonPart(NonInteractive)
      ++ {j|( Cmd_compute_toplevel $(ignoreAbstract) "$(content)" )|j};
    };

  /* Related issue and commit of agda/agda */
  /* https://github.com/agda/agda/issues/2730 */
  /* https://github.com/agda/agda/commit/021e6d24f47bac462d8bc88e2ea685d6156197c4 */
  | Give(goal) =>
    let index = goal.index;
    let content = Goal.getContent(goal);
    let range = buildRange(goal);
    if (Util.Version.gte(version, "2.5.3")) {
      commonPart(NonInteractive)
      ++ {j|( Cmd_give WithoutForce $(index) $(range) "$(content)" )|j};
    } else {
      commonPart(NonInteractive)
      ++ {j|( Cmd_give $(index) $(range) "$(content)" )|j};
    };

  | Refine(goal) =>
    let index = goal.index;
    let content = Goal.getContent(goal);
    let range = buildRange(goal);
    commonPart(NonInteractive)
    ++ {j|( Cmd_refine_or_intro False $(index) $(range) "$(content)" )|j};

  | Auto(goal) =>
    let index = goal.index;
    let content = Goal.getContent(goal);
    let range = buildRange(goal);
    if (Util.Version.gte(version, "2.6.0.1")) {
      // after 2.6.0.1
      commonPart(NonInteractive)
      ++ {j|( Cmd_autoOne $(index) $(range) "$(content)" )|j};
    } else {
      // the old way
      commonPart(NonInteractive)
      ++ {j|( Cmd_auto $(index) $(range) "$(content)" )|j};
    };

  | Case(goal) =>
    let index = goal.index;
    let content = Goal.getContent(goal);
    let range = buildRange(goal);
    commonPart(NonInteractive)
    ++ {j|( Cmd_make_case $(index) $(range) "$(content)" )|j};

  | GoalType(normalization, goal) =>
    let index = goal.index;
    let normalization' = Normalization.toString(normalization);
    commonPart(NonInteractive)
    ++ {j|( Cmd_goal_type $(normalization') $(index) noRange "" )|j};

  | Context(normalization, goal) =>
    let index = goal.index;
    let normalization' = Normalization.toString(normalization);
    commonPart(NonInteractive)
    ++ {j|( Cmd_context $(normalization') $(index) noRange "" )|j};

  | GoalTypeAndContext(normalization, goal) =>
    let index = goal.index;
    let normalization' = Normalization.toString(normalization);
    commonPart(NonInteractive)
    ++ {j|( Cmd_goal_type_context $(normalization') $(index) noRange "" )|j};

  | GoalTypeAndInferredType(normalization, goal) =>
    let index = goal.index;
    let content = Goal.getContent(goal);
    let normalization' = Normalization.toString(normalization);
    commonPart(NonInteractive)
    ++ {j|( Cmd_goal_type_context_infer $(normalization') $(index) noRange "$(content)" )|j};

  | GotoDefinition(name, goal) =>
    let index = goal.index;
    let content = Parser.userInput(name);
    commonPart(NonInteractive)
    ++ {j|( Cmd_why_in_scope $(index) noRange "$(content)" )|j};

  | GotoDefinitionGlobal(name) =>
    let content = Parser.userInput(name);
    commonPart(None') ++ {j|( Cmd_why_in_scope_toplevel "$(content)" )|j};
  };
};

let isLoad =
  fun
  | Load => true
  | _ => false;

let toString =
  fun
  | Load => "Load"
  | Abort => "Abort"
  | Compile => "Compile"
  | ToggleDisplayOfImplicitArguments => "ToggleDisplayOfImplicitArguments"
  | SolveConstraints => "SolveConstraints"
  | ShowConstraints => "ShowConstraints"
  | ShowGoals => "ShowGoals"
  | WhyInScope(string, goal) =>
    "WhyInScope \""
    ++ string
    ++ "\" (Goal "
    ++ string_of_int(goal.index)
    ++ ")"
  | WhyInScopeGlobal(string) => "WhyInScope \"" ++ string ++ "\" (Global)"
  | SearchAbout(norm, string) =>
    "SearchAbout \""
    ++ string
    ++ "\" ("
    ++ Normalization.toString(norm)
    ++ ")"
  | InferType(norm, string, goal) =>
    "InferType \""
    ++ string
    ++ "\" (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ Normalization.toString(norm)
    ++ ")"
  | InferTypeGlobal(norm, string) =>
    "InferType \""
    ++ string
    ++ "\" (Global, "
    ++ Normalization.toString(norm)
    ++ ")"
  | ModuleContents(norm, string, goal) =>
    "ModuleContents \""
    ++ string
    ++ "\" (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ Normalization.toString(norm)
    ++ ")"
  | ModuleContentsGlobal(norm, string) =>
    "ModuleContents \""
    ++ string
    ++ "\" (Global, "
    ++ Normalization.toString(norm)
    ++ ")"
  | ComputeNormalForm(computeMode, string, goal) =>
    "ComputeNormalForm \""
    ++ string
    ++ "\" (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ ComputeMode.toString(computeMode)
    ++ ")"
  | ComputeNormalFormGlobal(computeMode, string) =>
    "ComputeNormalForm \""
    ++ string
    ++ "\" (Global, "
    ++ ComputeMode.toString(computeMode)
    ++ ")"
  | Give(goal) => "Give (Goal " ++ string_of_int(goal.index) ++ ")"
  | Refine(goal) => "Refine (Goal " ++ string_of_int(goal.index) ++ ")"
  | Auto(goal) => "Auto (Goal " ++ string_of_int(goal.index) ++ ")"
  | Case(goal) => "Case (Goal " ++ string_of_int(goal.index) ++ ")"
  | GoalType(norm, goal) =>
    "GoalType (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ Normalization.toString(norm)
    ++ ")"
  | Context(norm, goal) =>
    "Context (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ Normalization.toString(norm)
    ++ ")"
  | GoalTypeAndContext(norm, goal) =>
    "GoalTypeAndContext (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ Normalization.toString(norm)
    ++ ")"
  | GoalTypeAndInferredType(norm, goal) =>
    "GoalTypeAndInferredType (Goal "
    ++ string_of_int(goal.index)
    ++ ", "
    ++ Normalization.toString(norm)
    ++ ")"
  | GotoDefinition(string, goal) =>
    "GotoDefinition \""
    ++ string
    ++ "\" (Goal "
    ++ string_of_int(goal.index)
    ++ ")"
  | GotoDefinitionGlobal(string) =>
    "GotoDefinition \"" ++ string ++ "\" (Global)";