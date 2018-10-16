module Parser = {
  open Rebase;
  open Util.Parser;
  open Type.Interaction.Emacs;
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
        |> Option.exists(line => Js.Re.test(line, restOfTheJudgement))
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
  let filepath =
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
          joined |> sliceToEnd(~from=1) |> trim |> Option.some;
        } else {
          joined |> trim |> Option.some;
        };
      },
    );
  let expr =
    String(
      raw =>
        raw
        |> String.trim
        /*                            1         2                        */
        |> Js.String.splitByRe([%re "/(\\?\\d+)|(\\_\\d+[^\\}\\)\\s]*)/"])
        |> (
          tokens =>
            tokens
            |> Array.mapi((token, i) =>
                 switch (i mod 3) {
                 | 1 => QuestionMark(token)
                 | 2 => Underscore(token)
                 | _ => Plain(token)
                 }
               )
            |> Option.some
        ),
    );
  module OutputConstraint = {
    let ofType =
      Regex(
        [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"],
        captured =>
          captured
          |> at(2, expr)
          |> Option.flatMap(type_ =>
               captured
               |> at(1, expr)
               |> Option.flatMap(term => Some(OfType(term, type_)))
             ),
      );
    let justType =
      Regex(
        [%re "/^Type ((?:\\n|.)+)/"],
        captured =>
          captured |> at(1, expr) |> Option.map(type_ => JustType(type_)),
      );
    let justSort =
      Regex(
        [%re "/^Sort ((?:\\n|.)+)/"],
        captured =>
          captured |> at(1, expr) |> Option.map(sort => JustSort(sort)),
      );
    let others =
      String(raw => raw |> parse(expr) |> Option.map(raw' => Others(raw')));
  };
  let outputConstraint: parser(outputConstraint) =
    choice([|
      OutputConstraint.ofType,
      OutputConstraint.justType,
      OutputConstraint.justSort,
      OutputConstraint.others,
    |]);
  module Output = {
    let outputWithoutRange: parser(output) =
      String(
        raw =>
          raw |> parse(outputConstraint) |> Option.map(x => Output(x, None)),
      );
    let outputWithRange: parser(output) =
      Regex(
        [%re
          "/((?:\\n|.)*\\S+)\\s*\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]/"
        ],
        captured =>
          Option.flatten(captured[1])
          |> Option.flatMap(raw => {
               open Type.Syntax.Position;
               let rowStart =
                 captured[3]
                 |> Option.getOr(Option.flatten(captured[7]))
                 |> Option.getOr("0")
                 |> int_of_string;
               let rowEnd =
                 captured[5]
                 |> Option.getOr(Option.flatten(captured[7]))
                 |> Option.getOr("0")
                 |> int_of_string;
               let colStart =
                 captured[4]
                 |> Option.getOr(Option.flatten(captured[8]))
                 |> Option.getOr("0")
                 |> int_of_string;
               let colEnd =
                 captured[6]
                 |> Option.getOr(Option.flatten(captured[9]))
                 |> Option.getOr("0")
                 |> int_of_string;
               let start = {pos: None, line: rowStart, col: colStart};
               let end_ = {pos: None, line: rowEnd, col: colEnd};
               raw
               |> parse(outputConstraint)
               |> Option.map(parsed => {
                    let path = captured |> at(2, filepath);
                    Output(parsed, Some(Range(path, [{start, end_}])));
                  });
             }),
      );
  };
  let output: parser(output) =
    String(
      raw => {
        let rangeRe = [%re
          "/\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]$/"
        ];
        let hasRange = Js.Re.test(raw, rangeRe);
        if (hasRange) {
          raw |> parse(Output.outputWithRange);
        } else {
          raw |> parse(Output.outputWithoutRange);
        };
      },
    );
  type allGoalsWarningsPartition = {
    metas: array(string),
    warnings: array(string),
    errors: array(string),
  };
  let allGoalsWarnings = (title, body) : allGoalsWarnings => {
    let partiteAllGoalsWarnings: (string, string) => allGoalsWarningsPartition =
      (title, body) => {
        let lines = body |> Js.String.split("\n");
        /* examine the header to see what's in the body */
        let hasMetas =
          title |> Js.String.match([%re "/Goals/"]) |> Option.isSome;
        let hasWarnings =
          title |> Js.String.match([%re "/Warnings/"]) |> Option.isSome;
        let hasErrors =
          title |> Js.String.match([%re "/Errors/"]) |> Option.isSome;
        let (indexOfWarnings, _) =
          lines
          |> Array.findIndex(s =>
               s
               |> Js.String.slice(~from=5, ~to_=13)
               |> Js.String.match([%re "/Warnings/"])
               |> Option.isSome
             )
          |> Option.getOr((0, ""));
        let (indexOfErrors, _) =
          lines
          |> Array.findIndex(s =>
               s
               |> Js.String.slice(~from=5, ~to_=11)
               |> Js.String.match([%re "/Errors/"])
               |> Option.isSome
             )
          |> Option.getOr((0, ""));
        switch (hasMetas, hasWarnings, hasErrors) {
        | (true, true, true) => {
            metas:
              lines |> Array.slice(~from=0, ~to_=indexOfWarnings) |> unindent,
            warnings:
              lines
              |> Array.slice(~from=indexOfWarnings + 1, ~to_=indexOfErrors),
            errors: lines |> Array.sliceFrom(indexOfErrors + 1),
          }
        | (true, true, false) => {
            metas:
              lines |> Array.slice(~from=0, ~to_=indexOfWarnings) |> unindent,
            warnings: lines |> Array.sliceFrom(indexOfWarnings + 1),
            errors: [||],
          }
        | (true, false, true) => {
            metas:
              lines |> Array.slice(~from=0, ~to_=indexOfErrors) |> unindent,
            warnings: [||],
            errors: lines |> Array.sliceFrom(indexOfErrors + 1),
          }
        | (true, false, false) => {
            metas: lines |> unindent,
            warnings: [||],
            errors: [||],
          }
        | (false, true, true) => {
            metas: [||],
            warnings: lines |> Array.slice(~from=0, ~to_=indexOfErrors),
            errors:
              lines
              |> Array.slice(
                   ~from=indexOfErrors + 1,
                   ~to_=Array.length(lines),
                 ),
          }
        | (false, true, false) => {
            metas: [||],
            warnings: lines,
            errors: [||],
          }
        | (false, false, true) => {
            metas: [||],
            warnings: [||],
            errors: lines,
          }
        | (false, false, false) => {
            metas: [||],
            warnings: [||],
            errors: [||],
          }
        };
      };
    let {metas, warnings, errors} = partiteAllGoalsWarnings(title, body);
    let indexOfHiddenMetas =
      metas
      |> Array.findIndex(s =>
           s |> parse(Output.outputWithRange) |> Option.isSome
         )
      |> Option.map(fst);
    let interactionMetas =
      switch (indexOfHiddenMetas) {
      | None => metas |> parseArray(Output.outputWithoutRange)
      | Some(n) =>
        metas
        |> Array.slice(~from=0, ~to_=n)
        |> parseArray(Output.outputWithoutRange)
      };
    let hiddenMetas =
      switch (indexOfHiddenMetas) {
      | None => [||]
      | Some(n) =>
        metas |> Array.sliceFrom(n) |> parseArray(Output.outputWithRange)
      };
    {interactionMetas, hiddenMetas, warnings, errors};
  };
  type goalTypeContextPartition = {
    goal: string,
    have: option(string),
    metas: array(string),
  };
  let goalTypeContext: string => goalTypeContext =
    raw => {
      let partiteGoalTypeContext: string => goalTypeContextPartition =
        raw => {
          let lines = raw |> Js.String.split("\n");
          let indexOfHave =
            lines
            |> Array.findIndex(s =>
                 s |> Js.String.match([%re "/^Have:/"]) |> Option.isSome
               );
          let indexOfDelimeter =
            lines
            |> Js.Array.findIndex(s =>
                 s |> Js.String.match([%re "/\\u2014{60}/g"]) |> Option.isSome
               );
          ();
          switch (indexOfHave) {
          | Some((n, _)) => {
              goal:
                lines
                |> Array.slice(~from=0, ~to_=n)
                |> List.fromArray
                |> String.join,
              have:
                lines
                |> Array.slice(~from=n, ~to_=indexOfDelimeter)
                |> List.fromArray
                |> String.join
                |> Option.some,
              metas: lines |> Array.sliceFrom(indexOfDelimeter + 1),
            }
          | None => {
              goal:
                lines
                |> Array.slice(~from=0, ~to_=indexOfDelimeter)
                |> List.fromArray
                |> String.join,
              have: None,
              metas: lines |> Array.sliceFrom(indexOfDelimeter + 1),
            }
          };
        };
      let {goal, have, metas} = partiteGoalTypeContext(raw);
      {
        goal:
          goal
          |> Js.String.sliceToEnd(~from=5)
          |> parse(expr)
          |> Option.map(x => Goal(x)),
        have:
          have
          |> Option.flatMap(line =>
               line
               |> Js.String.sliceToEnd(~from=5)
               |> parse(expr)
               |> Option.map(x => Have(x))
             ),
        interactionMetas: metas |> parseArray(Output.outputWithoutRange),
        hiddenMetas: metas |> parseArray(Output.outputWithRange),
      };
    };
  let constraints: string => array(output) =
    raw => {
      let shitpile = raw |> Js.String.split("\n") |> unindent;
      shitpile |> parseArray(output);
    };
  let body: bodyRaw => body =
    raw => {
      let kind =
        switch (raw |> kindGet) {
        | "AllGoalsWarnings" => AllGoalsWarnings
        | "GoalTypeContext" => GoalTypeContext
        | _ => PlainText
        };
      {kind, header: raw |> headerGet, body: raw |> bodyGet};
    };
};
