module Parser = {
  open Util.Parser;
  open Util.Option;
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
        && Js.Option.isSomeValue(
             (. _, line) => Js.Re.test(line, restOfTheJudgement),
             "",
             nextLine,
           )
        || Js.Re.test(line, completeJudgement);
      };
      let newLineIndices: array(int) =
        lines
        |> Js.Array.mapi((line, index) =>
             if (Array.length(lines) > index + 1) {
               (line, Some(lines[index + 1]), index);
             } else {
               (line, None, index);
             }
           )
        |> Js.Array.filter(((line, nextLine, _)) =>
             isNewline(line, nextLine)
           )
        |> Array.map(((_, _, index)) => index);
      newLineIndices
      |> Js.Array.mapi((index, i) =>
           if (Array.length(newLineIndices) === i + 1) {
             (index, Array.length(lines) + 1);
           } else {
             (index, newLineIndices[i + 1]);
           }
         )
      |> Array.map(((start, end_)) =>
           lines
           |> Js.Array.slice(~start, ~end_)
           |> Array.to_list
           |> String.concat("\n")
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
          |> Array.to_list
          |> String.concat("/");
        if (charCodeAt(0, joined) === 8234.0) {
          joined |> sliceToEnd(~from=1) |> trim |> Js.Option.some;
        } else {
          joined |> trim |> Js.Option.some;
        };
      },
    );
  let expr =
    String(
      raw =>
        raw
        |> Js.String.trim
        /*                            1         2                        */
        |> Js.String.splitByRe([%re "/(\\?\\d+)|(\\_\\d+[^\\}\\)\\s]*)/"])
        |> (
          tokens =>
            tokens
            |> Js.Array.mapi((token, i) =>
                 switch (i mod 3) {
                 | 1 => QuestionMark(token)
                 | 2 => Underscore(token)
                 | _ => Plain(token)
                 }
               )
            |> Js.Option.some
        ),
    );
  module OutputConstraint = {
    let ofType =
      Regex(
        [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"],
        captured =>
          captured
          |> at(2, expr)
          |> bind(type_ =>
               captured
               |> at(1, expr)
               |> bind(term => Some(OfType(term, type_)))
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
        raw => raw |> parse(outputConstraint) |> map(x => Output(x, None)),
      );
    let outputWithRange: parser(output) =
      Regex(
        [%re
          "/((?:\\n|.)*\\S+)\\s*\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]/"
        ],
        captured =>
          captured[1]
          |> bind(raw => {
               open Type.Syntax.Position;
               let getWithDefault = Js.Option.getWithDefault;
               let rowStart =
                 getWithDefault(
                   getWithDefault("0", captured[7]),
                   captured[3],
                 )
                 |> int_of_string;
               let rowEnd =
                 getWithDefault(
                   getWithDefault("0", captured[7]),
                   captured[5],
                 )
                 |> int_of_string;
               let colStart =
                 getWithDefault(
                   getWithDefault("0", captured[8]),
                   captured[4],
                 )
                 |> int_of_string;
               let colEnd =
                 getWithDefault(
                   getWithDefault("0", captured[9]),
                   captured[6],
                 )
                 |> int_of_string;
               let start = {pos: None, line: rowStart, col: colStart};
               let end_ = {pos: None, line: rowEnd, col: colEnd};
               raw
               |> parse(outputConstraint)
               |> map(parsed => {
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
        let shitpile = body |> Js.String.split("\n");
        let hasMetas =
          title |> Js.String.match([%re "/Goals/"]) |> Js.Option.isSome;
        let hasWarnings =
          title |> Js.String.match([%re "/Warnings/"]) |> Js.Option.isSome;
        let hasErrors =
          title |> Js.String.match([%re "/Errors/"]) |> Js.Option.isSome;
        let indexOfWarnings =
          shitpile
          |> Js.Array.findIndex(s =>
               s
               |> Js.String.slice(~from=5, ~to_=13)
               |> Js.String.match([%re "/Warnings/"])
               |> Js.Option.isSome
             );
        let indexOfErrors =
          shitpile
          |> Js.Array.findIndex(s =>
               s
               |> Js.String.slice(~from=5, ~to_=11)
               |> Js.String.match([%re "/Errors/"])
               |> Js.Option.isSome
             );
        switch (hasMetas, hasWarnings, hasErrors) {
        | (true, true, true) => {
            metas:
              shitpile
              |> Js.Array.slice(~start=0, ~end_=indexOfWarnings)
              |> unindent,
            warnings:
              shitpile
              |> Js.Array.slice(
                   ~start=indexOfWarnings + 1,
                   ~end_=indexOfErrors,
                 ),
            errors: shitpile |> Js.Array.sliceFrom(indexOfErrors + 1),
          }
        | (true, true, false) => {
            metas:
              shitpile
              |> Js.Array.slice(~start=0, ~end_=indexOfWarnings)
              |> unindent,
            warnings: shitpile |> Js.Array.sliceFrom(indexOfWarnings + 1),
            errors: [||],
          }
        | (true, false, true) => {
            metas:
              shitpile
              |> Js.Array.slice(~start=0, ~end_=indexOfErrors)
              |> unindent,
            warnings: [||],
            errors: shitpile |> Js.Array.sliceFrom(indexOfErrors + 1),
          }
        | (true, false, false) => {
            metas: shitpile |> unindent,
            warnings: [||],
            errors: [||],
          }
        | (false, true, true) => {
            metas: [||],
            warnings:
              shitpile |> Js.Array.slice(~start=0, ~end_=indexOfErrors),
            errors: shitpile |> Js.Array.sliceFrom(indexOfErrors + 1),
          }
        | (false, true, false) => {
            metas: [||],
            warnings: shitpile,
            errors: [||],
          }
        | (false, false, true) => {
            metas: [||],
            warnings: [||],
            errors: shitpile,
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
      |> Js.Array.findIndex(s =>
           s |> parse(Output.outputWithRange) |> Js.Option.isSome
         )
      |> (
        x =>
          switch (x) {
          | (-1) => None
          | _ => Some(x)
          }
      );
    let interactionMetas =
      switch (indexOfHiddenMetas) {
      | None => metas |> parseArray(Output.outputWithoutRange)
      | Some(n) =>
        metas
        |> Js.Array.slice(~start=0, ~end_=n)
        |> parseArray(Output.outputWithoutRange)
      };
    let hiddenMetas =
      switch (indexOfHiddenMetas) {
      | None => [||]
      | Some(n) =>
        metas |> Js.Array.sliceFrom(n) |> parseArray(Output.outputWithRange)
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
          let indexOfGoal =
            lines
            |> Js.Array.findIndex(s =>
                 s |> Js.String.match([%re "/^Goal:/"]) |> Js.Option.isSome
               );
          let indexOfHave =
            lines
            |> Js.Array.findIndex(s =>
                 s |> Js.String.match([%re "/^Have:/"]) |> Js.Option.isSome
               );
          let indexOfDelimeter =
            lines
            |> Js.Array.findIndex(s =>
                 s
                 |> Js.String.match([%re "/\\u2014{60}/g"])
                 |> Js.Option.isSome
               );
          if (indexOfHave === (-1)) {
            {
              goal:
                lines
                |> Js.Array.slice(~start=0, ~end_=indexOfDelimeter)
                |> Array.to_list
                |> String.concat(""),
              have: None,
              metas: lines |> Js.Array.sliceFrom(indexOfDelimeter + 1),
            };
          } else {
            {
              goal:
                lines
                |> Js.Array.slice(~start=0, ~end_=indexOfHave)
                |> Array.to_list
                |> String.concat(""),
              have:
                lines
                |> Js.Array.slice(~start=indexOfHave, ~end_=indexOfDelimeter)
                |> Array.to_list
                |> String.concat("")
                |> Js.Option.some,
              metas: lines |> Js.Array.sliceFrom(indexOfDelimeter + 1),
            };
          };
        };
      let {goal, have, metas} = partiteGoalTypeContext(raw);
      {
        goal:
          goal
          |> Js.String.sliceToEnd(~from=5)
          |> parse(expr)
          |> map(x => Goal(x)),
        have:
          have
          |> Js.Option.andThen((. line) =>
               line
               |> Js.String.sliceToEnd(~from=5)
               |> parse(expr)
               |> map(x => Have(x))
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
