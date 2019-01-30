open Rebase;

open Rebase.Option;

open Util.Parser;

/* open Type.Interaction.Emacs; */

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
      Js.Re.test(line, sort)
      || Js.Re.test(line, delimeter)
      || Js.Re.test(line, reallyLongTermIdentifier)
      && nextLine
      |> exists(line => Js.Re.test(line, restOfTheJudgement))
      || Js.Re.test(line, completeJudgement);
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
  Regex(
    [%re
      /*          |  different row                    |    same row            | */
      "/^(\\S+)\\:(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+))$/"
    ],
    captured => {
      open Type.Syntax.Position;
      let srcFile: srcFile = flatten(captured[1]);
      let sameRow = flatten(captured[6]) |> isSome;
      if (sameRow) {
        flatten(captured[6])
        |> flatMap(row =>
             flatten(captured[7])
             |> flatMap(colStart =>
                  flatten(captured[8])
                  |> flatMap(colEnd =>
                       Some(
                         Range(
                           srcFile,
                           [
                             {
                               start: {
                                 pos: None,
                                 line: int_of_string(row),
                                 col: int_of_string(colStart),
                               },
                               end_: {
                                 pos: None,
                                 line: int_of_string(row),
                                 col: int_of_string(colEnd),
                               },
                             },
                           ],
                         ),
                       )
                     )
                )
           );
      } else {
        flatten(captured[2])
        |> flatMap(rowStart =>
             flatten(captured[3])
             |> flatMap(colStart =>
                  flatten(captured[4])
                  |> flatMap(rowEnd =>
                       flatten(captured[5])
                       |> flatMap(colEnd =>
                            Some(
                              Range(
                                srcFile,
                                [
                                  {
                                    start: {
                                      pos: None,
                                      line: int_of_string(rowStart),
                                      col: int_of_string(colStart),
                                    },
                                    end_: {
                                      pos: None,
                                      line: int_of_string(rowEnd),
                                      col: int_of_string(colEnd),
                                    },
                                  },
                                ],
                              ),
                            )
                          )
                     )
                )
           );
      };
    },
  );

let expr = {
  Type.Interaction.Emacs.(
    String(
      raw =>
        raw
        |> String.trim
        /*                            1         2                        */
        |> Js.String.splitByRe([%re "/(\\?\\d+)|(\\_\\d+[^\\}\\)\\s]*)/"])
        |> Array.mapi((token, i) =>
             switch (i mod 3) {
             | 1 => QuestionMark(token)
             | 2 => Underscore(token)
             | _ => Plain(token)
             }
           )
        |> some,
    )
  );
};

module OutputConstraint = {
  open Type.Interaction.Emacs;
  let ofType =
    Regex(
      [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"],
      captured =>
        captured
        |> at(2, expr)
        |> flatMap(type_ =>
             captured
             |> at(1, expr)
             |> flatMap(term => Some(OfType(term, type_)))
           ),
    );
  let justType =
    Regex(
      [%re "/^Type ((?:\\n|.)+)/"],
      captured => captured |> at(1, expr) |> map(type_ => JustType(type_)),
    );
  let justSort =
    Regex(
      [%re "/^Sort ((?:\\n|.)+)/"],
      captured => captured |> at(1, expr) |> map(sort => JustSort(sort)),
    );
  let others =
    String(raw => raw |> parse(expr) |> map(raw' => Others(raw')));
};

let outputConstraint: parser(Type.Interaction.Emacs.outputConstraint) =
  choice([|
    OutputConstraint.ofType,
    OutputConstraint.justType,
    OutputConstraint.justSort,
    OutputConstraint.others,
  |]);

module Output = {
  open Type.Interaction.Emacs;
  let outputWithoutRange: parser(output) =
    String(
      raw => raw |> parse(outputConstraint) |> map(x => Output(x, None)),
    );
  let outputWithRange: parser(output) =
    Regex(
      [%re "/((?:\\n|.)*\\S+)\\s*\\[ at ([^\\]]+) \\]/"],
      captured =>
        flatten(captured[1])
        |> flatMap(parse(outputConstraint))
        |> map(oc => {
             let r = flatten(captured[2]) |> flatMap(parse(range));
             Output(oc, r);
           }),
    );
};

let output: parser(Type.Interaction.Emacs.output) =
  String(
    raw => {
      let rangeRe = [%re
        "/\\[ at (\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+)) \\]$/"
      ];
      let hasRange = Js.Re.test(raw, rangeRe);
      if (hasRange) {
        raw |> parse(Output.outputWithRange);
      } else {
        raw |> parse(Output.outputWithoutRange);
      };
    },
  );

let plainText: parser(Type.Interaction.Emacs.plainText) =
  String(
    raw =>
      Type.(
        raw
        |> Js.String.splitByRe(
             [%re
               "/(\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+))/"
             ],
           )
        |> Array.mapi((token, i) =>
             switch (i mod 2) {
             | 1 =>
               token |> parse(range) |> mapOr(x => Right(x), Left(token))
             | _ => Left(token)
             }
           )
        |> some
      ),
  );

/* warnings or errors */
let warningOrErrors: bool => parser(Type.Interaction.Emacs.warningError) =
  isWarning =>
    String(
      raw =>
        raw
        |> parse(plainText)
        |> map(body =>
             isWarning ?
               Type.Interaction.Emacs.WarningMessage(body) :
               Type.Interaction.Emacs.ErrorMessage(body)
           ),
    );

let warning = warningOrErrors(true);

let error = warningOrErrors(false);

let partiteMetas =
  Util.Dict.split("metas", (rawMetas: array(string)) => {
    let metas = unindent(rawMetas);
    let indexOfHiddenMetas =
      metas
      |> Array.findIndex(s => s |> parse(Output.outputWithRange) |> isSome)
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
  open Type.Interaction.Emacs;
  let partiteWarningsOrErrors = key =>
    Util.Dict.update(
      key,
      (raw: array(string)) => {
        let hasDelimeter =
          raw[0] |> flatMap(Js.String.match([%re "/^\\u2014{4}/"])) |> isSome;
        let lines = hasDelimeter ? raw |> Js.Array.sliceFrom(1) : raw;
        let markWarningStart = line => line |> parse(range) |> isSome;
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
          hasWarnings ?
            hasMetas ?
              /* Has both warnings and metas */
              line
              |> Js.String.slice(~from=5, ~to_=13)
              |> Js.String.match([%re "/Warnings/"])
              |> map(_ => "warnings") :
              /* Has only warnings */
              i === 0 ? Some("warnings") : None :
            /* Has no warnings */
            None;
        let markErrors = ((line, i)) =>
          hasErrors ?
            /* Has both warnings or metas and errors */
            hasMetas || hasWarnings ?
              line
              |> Js.String.slice(~from=5, ~to_=11)
              |> Js.String.match([%re "/Errors/"])
              |> map(_ => "errors") :
              /* Has only errors */
              i === 0 ? Some("errors") : None :
            None;
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
      |> mapOr(metas => metas |> parseArray(Output.outputWithoutRange), [||]);
    let hiddenMetas =
      "hiddenMetas"
      |> Js.Dict.get(dictionary)
      |> mapOr(metas => metas |> parseArray(Output.outputWithRange), [||]);
    let warnings =
      "warnings"
      |> Js.Dict.get(dictionary)
      |> mapOr(entries => entries |> parseArray(warning), [||]);
    let errors =
      "errors"
      |> Js.Dict.get(dictionary)
      |> mapOr(entries => entries |> parseArray(error), [||]);
    {interactionMetas, hiddenMetas, warnings, errors};
  };
  let goalTypeContext: string => goalTypeContext =
    raw => {
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
             |> parse(expr)
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
             |> parse(expr)
           )
        |> map(x => Have(x));
      let interactionMetas =
        "interactionMetas"
        |> Js.Dict.get(dictionary)
        |> mapOr(
             metas => metas |> parseArray(Output.outputWithoutRange),
             [||],
           );
      let hiddenMetas =
        "hiddenMetas"
        |> Js.Dict.get(dictionary)
        |> mapOr(metas => metas |> parseArray(Output.outputWithRange), [||]);
      {goal, have, interactionMetas, hiddenMetas};
    };
  let context: string => array(output) =
    raw => {
      let lines = raw |> Js.String.split("\n") |> unindent;
      lines |> parseArray(output);
    };
  let error: string => array(warningError) =
    raw => {
      let lines = raw |> Js.String.split("\n");
      lines
      |> Util.Dict.partite(((_, i)) => i === 0 ? Some("errors") : None)
      |> partiteWarningsOrErrors("errors")
      |> Js.Dict.get(_, "errors")
      |> mapOr(metas => metas |> parseArray(error), [||]);
    };
  let whyInScope: string => (plainText, array(Type.Syntax.Position.range)) =
    raw => {
      let ranges =
        raw
        |> Js.String.splitByRe(
             [%re
               "/its definition at (\\S+\\:(?:\\d+\\,\\d+\\-\\d+\\,\\d+|\\d+\\,\\d+\\-\\d+))/g"
             ],
           )
        |> Array.mapi((token, i) =>
             switch (i mod 2) {
             | 1 => token |> parse(range)
             | _ => None
             }
           )
        |> Util.Array_.catMaybes;
      (raw |> parse(plainText) |> getOr([||]), ranges);
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
        |> parseArray(output);
      (target, outputs);
    };
  let body: rawBody => body =
    raw => {
      let kind =
        switch (raw.kind) {
        | "AllGoalsWarnings" => AllGoalsWarnings
        | "GoalTypeContext" => GoalTypeContext
        | "Context" => Context
        | "WhyInScope" => WhyInScope
        | "SearchAbout" => SearchAbout
        | "Error" => Error
        | _ => PlainText
        };
      {kind, header: raw.header, body: raw.body};
    };
};

/* extract the first range and convert it to Atom Range */
let parseWhyInScope = raw => {
  let (_, ranges) = Response.whyInScope(raw);
  ranges[0]
  |> map(range =>
       (
         Component.Range.toAtomRange(range),
         Component.Range.toAtomFilepath(range),
       )
     );
};

/* Parsing S-Expressions */
/* Courtesy of @NightRa */
module SExpression = {
  type t =
    | A(string)
    | L(array(t));

  let preprocess = (string: string): result(string, string) => {
    /* Replace window's \\ in paths with /, so that \n doesn't get treated as newline. */
    let result = ref(string |> Js.String.replaceByRe([%re "/\\\\/g"], "/"));

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

      /* drop all single quotes: 'param => param */
      if (char == "\'" && ! in_str^) {
        ();
      } else if (char == "(" && ! in_str^) {
        stack |> Js.Array.push(ref(L([||]))) |> ignore;
      } else if (char == ")" && ! in_str^) {
        pushToTheTop(A(word^));
        word := "";
        switch (stack |> Js.Array.pop) {
        | Some(expr) => pushToTheTop(expr^)
        | None => ()
        };
      } else if (char == " " && ! in_str^) {
        pushToTheTop(A(word^));
        word := "";
      } else if (char == "\"") {
        in_str := ! in_str^;
      } else {
        word := word^ ++ char;
      };

      if (stack |> Array.length === 0) {
        Js.log(string);
      };
    };
    switch (stack[0]) {
    | None => Error(string)
    | Some(v) => Ok(v^)
    };
  };

  let parse = (string: string): result(t, string) => {
    string |> preprocess |> Result.flatMap(postprocess);
  };
};
