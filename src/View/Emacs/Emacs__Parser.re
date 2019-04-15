open Rebase;

open Rebase.Option;

open Type.View.Emacs;

/* open Type.View.Emacs; */

let unindent: array(string) => array(string) =
  lines => {
    let isNewline = (line, nextLine) => {
      let sort = [%re "/^Sort \\S*/"];
      let delimeter = [%re "/^\\u2014{4}/g"];
      /* banana : Banana */
      let completeJudgement = [%re
        "/^(?:(?:[^\\(\\{\\s]+\\s+\\:)|Have\\:|Goal\\:)\\s* \\S*/"
      ];
      /* case when the term's name is too long, the rest of the judgement
            would go to the next line, e.g:
                 banananananananananananananananana
                     : Banana
         */
      let reallyLongTermIdentifier = [%re "/^\\S+$/"];
      let restOfTheJudgement = [%re "/^\\s*\\:\\s* \\S*/"];
      Js.Re.test_(sort, line)
      || Js.Re.test_(delimeter, line)
      || Js.Re.test_(reallyLongTermIdentifier, line)
      && nextLine
      |> exists(line => Js.Re.test_(restOfTheJudgement, line))
      || Js.Re.test_(completeJudgement, line);
    };
    let newLineIndices: array(int) =
      lines
      |> Array.mapi((line, index) => (line, lines[index + 1], index))
      |> Array.filter(((line, nextLine, _)) => isNewline(line, nextLine))
      |> Array.map(((_, _, index)) => index);
    newLineIndices
    |> Array.mapi((index, i) =>
         switch (newLineIndices[i + 1]) {
         | None => (index, Array.length(lines) + 1)
         | Some(n) => (index, n)
         }
       )
    |> Array.map(((from, to_)) =>
         lines
         |> Array.slice(~from, ~to_)
         |> List.fromArray
         |> String.joinWith("\n")
       );
  };

/* let filepath =
   String(
     raw => {
       open Js.String;
       /* remove newlines and sanitize with path.parse  */
       let parsed = raw |> replace("\n", "") |> Node.Path.parse;
       /* join it back and replace Windows' stupid backslash with slash */
       let joined =
         Node.Path.join2(parsed##dir, parsed##base)
         |> split(Node.Path.sep)
         |> List.fromArray
         |> String.joinWith("/");
       if (charCodeAt(0, joined) === 8234.0) {
         joined |> sliceToEnd(~from=1) |> trim |> some;
       } else {
         joined |> trim |> some;
       };
     },
   ); */

let range =
  [%re
    /*          |  different row                    |    same row            | */
    "/^(\\S+)\\:(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+))$/"
  ]
  |> Parser.captures(captured => {
       open Type.Location;
       let srcFile = flatten(captured[1]);
       let sameRow = flatten(captured[6]) |> isSome;
       if (sameRow) {
         flatten(captured[6])
         |> flatMap(Parser.int)
         |> flatMap(row =>
              flatten(captured[7])
              |> flatMap(Parser.int)
              |> flatMap(colStart =>
                   flatten(captured[8])
                   |> flatMap(Parser.int)
                   |> flatMap(colEnd =>
                        Some(
                          Range.Range(
                            srcFile,
                            [|
                              {
                                start: {
                                  pos: None,
                                  line: row,
                                  col: colStart,
                                },
                                end_: {
                                  pos: None,
                                  line: row,
                                  col: colEnd,
                                },
                              },
                            |],
                          ),
                        )
                      )
                 )
            );
       } else {
         flatten(captured[2])
         |> flatMap(Parser.int)
         |> flatMap(rowStart =>
              flatten(captured[3])
              |> flatMap(Parser.int)
              |> flatMap(colStart =>
                   flatten(captured[4])
                   |> flatMap(Parser.int)
                   |> flatMap(rowEnd =>
                        flatten(captured[5])
                        |> flatMap(Parser.int)
                        |> flatMap(colEnd =>
                             Some(
                               Range.Range(
                                 srcFile,
                                 [|
                                   {
                                     start: {
                                       pos: None,
                                       line: rowStart,
                                       col: colStart,
                                     },
                                     end_: {
                                       pos: None,
                                       line: rowEnd,
                                       col: colEnd,
                                     },
                                   },
                                 |],
                               ),
                             )
                           )
                      )
                 )
            );
       };
     });

let expr = raw =>
  raw
  |> String.trim
  /*                            1         2                        */
  |> Util.safeSplitByRe([%re "/(\\?\\d+)|(\\_\\d+[^\\}\\)\\s]*)/"])
  |> Array.mapi((token, i) =>
       switch (i mod 3) {
       | 1 =>
         token
         |> map(Js.String.sliceToEnd(~from=1))
         |> flatMap(Parser.int)
         |> map(x => QuestionMark(x))
       | 2 => token |> map(x => Underscore(x))
       | _ => token |> map(x => Plain(x))
       }
     )
  |> Array.filterMap(x => x)
  |> some;

module OutputConstraint = {
  let ofType =
    [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"]
    |> Parser.captures(captured =>
         captured
         |> Parser.at(2, expr)
         |> flatMap(type_ =>
              captured
              |> Parser.at(1, expr)
              |> flatMap(term => Some(OfType(term, type_)))
            )
       );
  let justType =
    [%re "/^Type ((?:\\n|.)+)/"]
    |> Parser.captures(captured =>
         captured |> Parser.at(1, expr) |> map(type_ => JustType(type_))
       );
  let justSort =
    [%re "/^Sort ((?:\\n|.)+)/"]
    |> Parser.captures(captured =>
         captured |> Parser.at(1, expr) |> map(sort => JustSort(sort))
       );
  let others = raw => raw |> expr |> map(raw' => Others(raw'));
};

let outputConstraint =
  Parser.choice([|
    OutputConstraint.ofType,
    OutputConstraint.justType,
    OutputConstraint.justSort,
    OutputConstraint.others,
  |]);

module Output = {
  let outputWithoutRange = raw =>
    raw |> outputConstraint |> map(x => Output(x, None));
  let outputWithRange =
    [%re "/((?:\\n|.)*\\S+)\\s*\\[ at ([^\\]]+) \\]/"]
    |> Parser.captures(captured =>
         flatten(captured[1])
         |> flatMap(outputConstraint)
         |> map(oc => {
              let r = flatten(captured[2]) |> flatMap(range);
              Output(oc, r);
            })
       );
};

let output = raw => {
  let rangeRe = [%re
    "/\\[ at (\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+)) \\]$/"
  ];
  let hasRange = Js.Re.test_(rangeRe, raw);
  if (hasRange) {
    raw |> Output.outputWithRange;
  } else {
    raw |> Output.outputWithoutRange;
  };
};

let plainText = raw =>
  raw
  |> Util.safeSplitByRe(
       [%re "/(\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+))/"],
     )
  |> Array.filterMap(x => x)
  |> Array.mapi((token, i) =>
       switch (i mod 2) {
       | 1 =>
         token
         |> range
         |> mapOr(
              x => Type.View.Emacs.Range(x),
              Type.View.Emacs.Text(token),
            )
       | _ => Type.View.Emacs.Text(token)
       }
     )
  |> some;

/* warnings or errors */
let warningOrErrors = (isWarning, raw) =>
  raw
  |> plainText
  |> map(body =>
       isWarning
         ? Type.View.Emacs.WarningMessage(body)
         : Type.View.Emacs.ErrorMessage(body)
     );

let warning = warningOrErrors(true);

let error = warningOrErrors(false);

let partiteMetas =
  Util.Dict.split("metas", (rawMetas: array(string)) => {
    let metas = unindent(rawMetas);
    let indexOfHiddenMetas =
      metas
      |> Array.findIndex(s => s |> Output.outputWithRange |> isSome)
      |> map(fst);
    metas
    |> Util.Dict.partite(((_, i)) =>
         switch (indexOfHiddenMetas) {
         | Some(n) =>
           if (i === n) {
             Some("hiddenMetas");
           } else if (i === 0) {
             Some("interactionMetas");
           } else {
             None;
           }
         | None =>
           /* All interaction metas */
           if (i === 0) {
             Some("interactionMetas");
           } else {
             None;
           }
         }
       );
  });

module Response = {
  let partiteWarningsOrErrors = key =>
    Util.Dict.update(
      key,
      (raw: array(string)) => {
        let hasDelimeter =
          raw[0] |> flatMap(Js.String.match([%re "/^\\u2014{4}/"])) |> isSome;
        let lines = hasDelimeter ? raw |> Js.Array.sliceFrom(1) : raw;
        let markWarningStart = line => line |> range |> isSome;
        /* If the previous warning of error ends with "at", then we have to glue it back */
        let glueBack = xs =>
          xs[Array.length(xs) - 1]
          |> flatMap(Js.String.match([%re "/at$/"]))
          |> isSome;
        lines
        |> Util.Array_.partite(markWarningStart)
        |> Util.Array_.mergeWithNext(glueBack)
        |> Array.map(xs => xs |> List.fromArray |> String.joinWith("\n"));
      },
    );
  let allGoalsWarnings = (title, body): allGoalsWarnings => {
    let partiteAllGoalsWarnings: (string, string) => Js.Dict.t(array(string)) =
      (title, body) => {
        let lines = body |> Js.String.split("\n");
        /* examine the header to see what's in the body */
        let hasMetas = title |> Js.String.match([%re "/Goals/"]) |> isSome;
        let hasWarnings =
          title |> Js.String.match([%re "/Warnings/"]) |> isSome;
        let hasErrors = title |> Js.String.match([%re "/Errors/"]) |> isSome;
        /* predicates for partitioning the body */
        let markMetas = ((_, i)) =>
          hasMetas && i === 0 ? Some("metas") : None;
        let markWarnings = ((line, i)) =>
          hasWarnings
            ? hasMetas
                /* Has both warnings and metas */
                ? line
                  |> Js.String.slice(~from=5, ~to_=13)
                  |> Js.String.match([%re "/Warnings/"])
                  |> map(_ => "warnings")
                /* Has only warnings */
                : i === 0 ? Some("warnings") : None
            /* Has no warnings */
            : None;
        let markErrors = ((line, i)) =>
          hasErrors
            /* Has both warnings or metas and errors */
            ? hasMetas || hasWarnings
                ? line
                  |> Js.String.slice(~from=5, ~to_=11)
                  |> Js.String.match([%re "/Errors/"])
                  |> map(_ => "errors")
                /* Has only errors */
                : i === 0 ? Some("errors") : None
            : None;
        lines
        |> Util.Dict.partite(line =>
             or_(
               or_(markMetas(line), markWarnings(line)),
               markErrors(line),
             )
           );
      };
    let dictionary: Js.Dict.t(array(string)) =
      partiteAllGoalsWarnings(title, body)
      |> partiteMetas
      |> partiteWarningsOrErrors("warnings")
      |> partiteWarningsOrErrors("errors");
    /* extract entries from the dictionary */
    let interactionMetas =
      "interactionMetas"
      |> Js.Dict.get(dictionary)
      |> mapOr(
           metas =>
             metas
             |> Array.map(Output.outputWithoutRange)
             |> Array.filterMap(x => x),
           [||],
         );
    let hiddenMetas =
      "hiddenMetas"
      |> Js.Dict.get(dictionary)
      |> mapOr(
           metas =>
             metas
             |> Array.map(Output.outputWithRange)
             |> Array.filterMap(x => x),
           [||],
         );
    let warnings =
      "warnings"
      |> Js.Dict.get(dictionary)
      |> mapOr(
           entries =>
             entries |> Array.map(warning) |> Array.filterMap(x => x),
           [||],
         );
    let errors =
      "errors"
      |> Js.Dict.get(dictionary)
      |> mapOr(
           entries => entries |> Array.map(error) |> Array.filterMap(x => x),
           [||],
         );
    {title, interactionMetas, hiddenMetas, warnings, errors};
  };
  let goalTypeContext: string => goalTypeContext =
    raw => {
      Js.log(raw);
      let markGoal = ((line, _)) =>
        line |> Js.String.match([%re "/^Goal:/"]) |> map(_ => "goal");
      let markHave = ((line, _)) =>
        line |> Js.String.match([%re "/^Have:/"]) |> map(_ => "have");
      let markMetas = ((line, _)) =>
        line |> Js.String.match([%re "/\\u2014{60}/g"]) |> map(_ => "metas");
      let partiteGoalTypeContext =
        Util.Dict.partite(line =>
          or_(or_(markGoal(line), markHave(line)), markMetas(line))
        );
      let removeDelimeter = Util.Dict.update("metas", Js.Array.sliceFrom(1));
      let lines = raw |> Js.String.split("\n");
      let dictionary =
        lines |> partiteGoalTypeContext |> removeDelimeter |> partiteMetas;
      /* extract entries from the dictionary */
      let goal =
        "goal"
        |> Js.Dict.get(dictionary)
        |> flatMap(line =>
             line
             |> List.fromArray
             |> String.joinWith("\n")
             |> Js.String.sliceToEnd(~from=5)
             |> expr
           )
        |> map(x => Goal(x));
      let have =
        "have"
        |> Js.Dict.get(dictionary)
        |> flatMap(line =>
             line
             |> List.fromArray
             |> String.joinWith("\n")
             |> Js.String.sliceToEnd(~from=5)
             |> expr
           )
        |> map(x => Have(x));
      let interactionMetas =
        "interactionMetas"
        |> Js.Dict.get(dictionary)
        |> mapOr(
             metas =>
               metas
               |> Array.map(Output.outputWithoutRange)
               |> Array.filterMap(x => x),
             [||],
           );
      let hiddenMetas =
        "hiddenMetas"
        |> Js.Dict.get(dictionary)
        |> mapOr(
             metas =>
               metas
               |> Array.map(Output.outputWithRange)
               |> Array.filterMap(x => x),
             [||],
           );
      {goal, have, interactionMetas, hiddenMetas};
    };
  let context: string => array(output) =
    raw => {
      let lines = raw |> Js.String.split("\n") |> unindent;
      lines |> Array.map(output) |> Array.filterMap(x => x);
    };
  let error: string => array(warningError) =
    raw => {
      let lines = raw |> Js.String.split("\n");
      lines
      |> Util.Dict.partite(((_, i)) => i === 0 ? Some("errors") : None)
      |> partiteWarningsOrErrors("errors")
      |> Js.Dict.get(_, "errors")
      |> mapOr(
           metas => metas |> Array.map(error) |> Array.filterMap(x => x),
           [||],
         );
    };
  let whyInScope:
    string =>
    (array(Type.View.Emacs.textOrRange), array(Type.Location.Range.t)) =
    raw => {
      let ranges =
        raw
        |> Util.safeSplitByRe(
             [%re
               "/its definition at (\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+))/g"
             ],
           )
        |> Array.mapi((token, i) =>
             switch (i mod 2) {
             | 1 => token |> Option.flatMap(range)
             | _ => None
             }
           )
        |> Array.filterMap(x => x);
      (raw |> plainText |> getOr([||]), ranges);
    };
  let searchAbout: string => (string, array(output)) =
    raw => {
      let lines = raw |> Js.String.split("\n");
      let target =
        lines[0] |> map(Js.String.sliceToEnd(~from=18)) |> getOr("???");
      let outputs =
        lines
        |> Js.Array.sliceFrom(1)
        |> Array.map(s => s |> Js.String.sliceToEnd(~from=2))
        |> unindent
        |> Array.map(output)
        |> Array.filterMap(x => x);
      (target, outputs);
    };
};

/* Parsing S-Expressions */
/* Courtesy of @NightRa */
module SExpression = {
  type t =
    | A(string)
    | L(array(t));

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
        |> Js.String.substring(~from=index, ~to_=String.length(string) - 1),
      );
    } else {
      Ok(result^);
    };
  };

  let rec toString =
    fun
    | A(s) => "\"" ++ s ++ "\""
    | L(xs) =>
      "[" ++ (Array.map(toString, xs) |> Js.Array.joinWith(", ")) ++ "]";

  let rec flatten: t => array(string) =
    fun
    | A(s) => [|s|]
    | L(xs) => xs |> Array.flatMap(flatten);

  let postprocess = (string: string): result(t, string) => {
    let stack: array(ref(t)) = [|ref(L([||]))|];
    let word = ref("");
    let escaped = ref(false);
    let in_str = ref(false);

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
    switch (stack[0]) {
    | None => Error(string)
    | Some(v) =>
      switch (v^) {
      | L(xs) =>
        switch (xs[0]) {
        | None => Error(string)
        | Some(w) => Ok(w)
        }
      | _ => Error(string)
      }
    };
  };

  let parse = (string: string): result(t, string) => {
    string |> preprocess |> Result.flatMap(postprocess);
  };

  let parseFile = (content: string): array(result(t, string)) => {
    content
    |> Util.safeSplitByRe([%re "/\\r\\n|\\n/"])
    |> Array.map(result =>
         switch (result) {
         | None => None
         | Some("") => None
         | Some(chunk) => Some(chunk)
         }
       )
    |> Array.filterMap(x => x)
    |> Array.map(line => line |> Js.String.trim |> parse);
  };
};
