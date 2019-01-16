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
