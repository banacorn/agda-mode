open Task;
open! Type.View.Header;

// Response.Info => Task
let handle = (info: Response.Info.t): list(Task.t) =>
  switch (info) {
  | CompilationOk => [Display("Compilation Done!", Success, Nothing)]
  | Constraints(None) => [Display("No Constraints", Success, Nothing)]
  | Constraints(Some(payload)) => [
      Display("Constraints", Info, Emacs(Constraints(payload))),
    ]
  | AllGoalsWarnings(payload) => [
      Display(payload.title, Info, Emacs(AllGoalsWarnings(payload))),
    ]
  | Time(payload) => [
      Display("Time", PlainText, Emacs(PlainText(payload))),
    ]
  | Error(payload) => [Display("Error", Error, Emacs(Error(payload)))]
  | Intro(payload) => [
      Display("Intro", PlainText, Emacs(PlainText(payload))),
    ]
  | Auto(payload) => [
      Display("Auto", PlainText, Emacs(PlainText(payload))),
    ]
  | ModuleContents(payload) => [
      Display("Module Contents", Info, Emacs(PlainText(payload))),
    ]
  | SearchAbout(payload) => [
      Display(
        "Searching about ...",
        PlainText,
        Emacs(SearchAbout(payload)),
      ),
    ]
  | WhyInScope(payload) => [
      Display("Scope info", Info, Emacs(WhyInScope(payload))),
    ]
  | NormalForm(payload) => [
      Display("Normal form", Info, Emacs(PlainText(payload))),
    ]
  | GoalType(payload) => [
      Display("Goal type", Info, Emacs(GoalTypeContext(payload))),
    ]
  | CurrentGoal(payload) => [
      Display("Current goal", Info, Emacs(PlainText(payload))),
    ]
  | InferredType(payload) => [
      Display("Inferred type", Info, Emacs(PlainText(payload))),
    ]
  | Context(payload) => [
      Display("Context", Info, Emacs(Context(payload))),
    ]
  | HelperFunction(payload) => [
      Display("Helper function", Info, Emacs(PlainText(payload))),
    ]
  | Version(payload) => [
      Display("Version", Info, Emacs(PlainText(payload))),
    ]
  };
