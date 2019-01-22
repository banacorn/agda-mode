open Rebase;

let userInput = s => {
  let trim = s =>
    Atom.Environment.Config.get("agda-mode.trimSpaces") ? String.trim(s) : s;

  s
  |> Js.String.replaceByRe([%re "/\\\\/g"], "\\\\")
  |> Js.String.replaceByRe([%re "/\\\"/g"], "\\\"")
  |> Js.String.replaceByRe([%re "/\\n/g"], "\\n")
  |> trim;
};

let filepath = s => {
  let s' = ref(s);
  /* remove the Windows Bidi control character */
  if (Js.String.charCodeAt(0, s) === 8234.0) {
    s' := s'^ |> Js.String.sliceToEnd(~from=1);
  };

  s'^ |> String.trim;
};

let rectifyEmacs = s => {
  let s' = ref(s);
  /* remove the Windows Bidi control character */
  if (Js.String.charCodeAt(0, s) === 8234.0) {
    s' := s'^ |> Js.String.sliceToEnd(~from=1);
  };

  s'^ |> String.trim;
};

/*
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
 "go-to-definition", */
