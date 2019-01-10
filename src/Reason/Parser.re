let userInput = s => {
  s
  |> Js.String.replaceByRe([%re "/\\\\/g"], "\\\\")
  |> Js.String.replaceByRe([%re "/\\\"/g"], "\\\"")
  |> Js.String.replaceByRe([%re "/\\n/g"], "\\n");
                                                  /* if (atom.config.get('agda-mode.trimSpaces'))
                                                         return expr.trim();
                                                     else
                                                         return expr; */
};
