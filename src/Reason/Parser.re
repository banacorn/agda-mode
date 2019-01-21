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
