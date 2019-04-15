open Rebase;

let captures = (handler, regex, raw) =>
  Js.Re.exec_(regex, raw)
  |> Option.map(result =>
       result |> Js.Re.captures |> Array.map(Js.Nullable.toOption)
     )
  |> Option.flatMap(handler);

type error =
  | Response(array(string))
  | Others(string);

let agdaOutput = s => {
  s |> Js.String.replaceByRe([%re "/\\\\n/g"], "\n");
};
let at =
    (i: int, parser: string => option('a), captured: array(option(string)))
    : option('a) =>
  if (i >= Array.length(captured)) {
    None;
  } else {
    Option.flatten(captured[i]) |> Option.flatMap(parser);
  };

let choice = (res: array(string => option('a)), raw) =>
  Array.reduce(
    (result, parse) =>
      switch (result) {
      /* Done, pass it on */
      | Some(value) => Some(value)
      /* Failed, try this one */
      | None => parse(raw)
      },
    None,
    res,
  );

// let many = (parse: string => option('a), raw: string): array('a) => {
//   raw |> Array.map(parse) |> Array.filterMap(x => x);
// };

// replacement of `int_of_string`
let int = s =>
  switch (int_of_string(s)) {
  | i => Some(i)
  | exception _ => None
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
