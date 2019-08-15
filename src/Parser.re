open Rebase;

// indicates at which stage the parse error happened
module Error = {
  type t =
    | SExpression(int, string)
    | Response(int, Parser__Type.SExpression.t);

  let toString =
    fun
    | SExpression(errno, string) =>
      "Parse error code: S" ++ string_of_int(errno) ++ "\n" ++ string
    | Response(errno, sexpr) =>
      "Parse error code: R"
      ++ string_of_int(errno)
      ++ "\n"
      ++ Parser__Type.SExpression.toString(sexpr);
};

let captures = (handler, regex, raw) =>
  Js.Re.exec_(regex, raw)
  |> Option.map(result =>
       result |> Js.Re.captures |> Array.map(Js.Nullable.toOption)
     )
  |> Option.flatMap(handler);

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
    Atom.Config.get("agda-mode.trimSpaces") ? String.trim(s) : s;
  s
  |> Js.String.replaceByRe([%re "/\\\\/g"], "\\\\")
  |> Js.String.replaceByRe([%re "/\\\"/g"], "\\\"")
  |> Js.String.replaceByRe([%re "/\\n/g"], "\\n")
  |> trim;
};

let filepath = s => {
  // remove the Windows Bidi control character
  let removedBidi =
    if (Js.String.charCodeAt(0, s) === 8234.0) {
      s |> Js.String.sliceToEnd(~from=1);
    } else {
      s;
    };

  // normalize the path with Node.Path.normalize
  let normalized = removedBidi |> Node.Path.normalize;

  // replace Windows' stupid backslash with slash
  let replaced = normalized |> Js.String.replaceByRe([%re "/\\\\/g"], "/");

  replaced;
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

let splitAndTrim = string =>
  string
  |> Util.safeSplitByRe([%re "/\\r\\n|\\n/"])
  |> Array.map(result =>
       switch (result) {
       | None => None
       | Some("") => None
       | Some(chunk) => Some(chunk)
       }
     )
  |> Array.filterMap(x => x)
  |> Array.map(Js.String.trim);

/* Parsing S-Expressions */
/* Courtesy of @NightRa */
module SExpression = {
  type t = Parser__Type.SExpression.t;
  let toString = Parser__Type.SExpression.toString;
  open! Parser__Type.SExpression;
  type state = {
    stack: array(ref(t)),
    word: ref(string),
    escaped: ref(bool),
    in_str: ref(bool),
  };
  type continuation =
    | Error(int, string) // int for error index
    | Continue(string => continuation)
    | Done(t);

  let preprocess = (string: string): result(string, string) => {
    /* Replace window's \\ in paths with /, so that \n doesn't get treated as newline. */
    let result =
      ref(string |> Js.String.replaceByRe([%re "/\\\\\\\\/g"], "/"));

    /* handles Agda parse error */
    if (result^ |> Js.String.substring(~from=0, ~to_=13) === "cannot read: ") {
      Error(Js.String.sliceToEnd(~from=12, result^));
    } else if
      /* drop priority prefixes like ((last . 1)) as they are all constants with respect to responses

         the following text from agda-mode.el explains what are those
         "last . n" prefixes for:
             Every command is run by this function, unless it has the form
             "(('last . priority) . cmd)", in which case it is run by
             `agda2-run-last-commands' at the end, after the Agda2 prompt
             has reappeared, after all non-last commands, and after all
             interactive highlighting is complete. The last commands can have
             different integer priorities; those with the lowest priority are
             executed first. */
      (result^ |> String.startsWith("((last")) {
      let index = result^ |> Js.String.indexOf("(agda");
      Ok(
        result^
        |> Js.String.substring(~from=index, ~to_=String.length(result^) - 1),
      );
    } else {
      Ok(result^);
    };
  };

  let rec flatten: t => array(string) =
    fun
    | A(s) => [|s|]
    | L(xs) => xs |> Array.flatMap(flatten);

  let initialState = () => {
    stack: [|ref(L([||]))|],
    word: ref(""),
    escaped: ref(false),
    in_str: ref(false),
  };

  let rec parseSExpression = (state: state, string: string): continuation => {
    let {stack, word, escaped, in_str} = state;

    let pushToTheTop = (elem: t) => {
      let index = Array.length(stack) - 1;

      switch (stack[index]) {
      | Some(expr) =>
        switch (expr^) {
        | A(_) => expr := L([|expr^, elem|])
        | L(xs) => xs |> Js.Array.push(elem) |> ignore
        }
      | None => ()
      };
    };
    /* iterates through the string */
    let totalLength = String.length(string);

    for (i in 0 to totalLength - 1) {
      let char = string |> Js.String.charAt(i);

      if (escaped^) {
        /* something was being escaped */
        /* put the backslash \ back in */
        if (char == "n") {
          word := word^ ++ "\\";
        };
        word := word^ ++ char;
        escaped := false;
      } else if (char == "\'" && ! in_str^) {
        ();
          /* drop all single quotes: 'param => param */
      } else if (char == "(" && ! in_str^) {
        stack |> Js.Array.push(ref(L([||]))) |> ignore;
      } else if (char == ")" && ! in_str^) {
        if (word^ != "") {
          pushToTheTop(A(word^));
          word := "";
        };
        switch (stack |> Js.Array.pop) {
        | Some(expr) => pushToTheTop(expr^)
        | None => ()
        };
      } else if (char == " " && ! in_str^) {
        if (word^ != "") {
          pushToTheTop(A(word^));
          word := "";
        };
      } else if (char == "\"") {
        in_str := ! in_str^;
      } else if (char == "\\" && in_str^) {
        /* something is being escaped */
        escaped := true;
      } else {
        word := word^ ++ char;
      };
    };
    switch (Array.length(stack)) {
    | 0 => Error(0, string)
    | 1 =>
      switch (stack[0]) {
      | None => Error(1, string)
      | Some(v) =>
        switch (v^) {
        | L(xs) =>
          switch (xs[0]) {
          | None => Error(2, string)
          | Some(w) => Done(w)
          }
        | _ => Error(3, string)
        }
      }
    | _ => Continue(parseSExpression(state))
    };
  };

  let incrParse = (string: string): continuation => {
    switch (preprocess(string)) {
    | Error(_) => Error(4, string)
    | Ok(processed) => parseSExpression(initialState(), processed)
    };
  };
  // (int, string) as the error index and the raw input
  let parse = (string: string): result(array(t), (int, string)) => {
    let results = ref([||]);
    let error = ref(None);
    let continuation = ref(None);
    string
    |> splitAndTrim
    |> Array.forEach(line => {
         // get the parsing continuation or initialize a new one
         let continue = continuation^ |> Option.getOr(incrParse);

         // continue parsing with the given continuation
         switch (continue(line)) {
         | Error(n, err) => error := Some((n, err))
         | Continue(continue) => continuation := Some(continue)
         | Done(result) =>
           results^ |> Js.Array.push(result) |> ignore;
           continuation := None;
         };
       });

    switch (error^) {
    | Some((n, err)) => Error((n, err))
    | None => Ok(results^)
    };
  };
};
