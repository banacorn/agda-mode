open Rebase;

type error =
  | Response(array(string))
  | Others(string);

let agdaOutput = s => {
  s |> Js.String.replaceByRe([%re "/\\\\n/g"], "\n");
};

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

let commandLine = s => {
  let parts =
    s
    |> Js.String.replaceByRe([%re "/\\s+/g"], " ")
    |> Js.String.split(" ")
    |> List.fromArray;
  switch (parts) {
  | [] => ("", [||])
  | [path, ...args] => (filepath(path), Array.fromList(args))
  };
};

let rectifyEmacs = s => {
  let s' = ref(s);
  /* remove the Windows Bidi control character */
  if (Js.String.charCodeAt(0, s) === 8234.0) {
    s' := s'^ |> Js.String.sliceToEnd(~from=1);
  };

  s'^ |> String.trim;
};
