module Parser = {
  open Util.Parser;
  open Util.Option;
  open Type.Interaction.Emacs;
  let unindent: array(string) => array(string) =
    lines => {
      let lineStart = [%re "/^\\S+/"];
      let lineStartIndices: array(int) =
        lines
        |> Js.Array.mapi((line, index) => (line, index))
        |> Js.Array.filter(((line, index)) => Js.Re.test(line, lineStart))
        |> Array.map(((_, index)) => index);
      lineStartIndices
      |> Js.Array.mapi((index, i) =>
           if (Array.length(lineStartIndices) === i + 1) {
             (index, Array.length(lines) + 1);
           } else {
             (index, lineStartIndices[i + 1]);
           }
         )
      |> Array.map(((start, end_)) =>
           lines
           |> Js.Array.slice(~start, ~end_)
           |> Array.to_list
           |> String.concat("\n")
         );
    };
  type allGoalsWarningsPreprocess = {
    metas: array(string),
    warnings: array(string),
    errors: array(string),
  };
  let allGoalsWarningsPreprocess:
    (string, string) => allGoalsWarningsPreprocess =
    (title, body) => {
      let shitpile = body |> Js.String.split("\n") |> unindent;
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
          metas: shitpile |> Js.Array.slice(~start=0, ~end_=indexOfWarnings),
          warnings:
            shitpile
            |> Js.Array.slice(~start=indexOfWarnings + 1, ~end_=indexOfErrors),
          errors: shitpile |> Js.Array.sliceFrom(indexOfErrors + 1),
        }
      | (true, true, false) => {
          metas: shitpile |> Js.Array.slice(~start=0, ~end_=indexOfWarnings),
          warnings: shitpile |> Js.Array.sliceFrom(indexOfWarnings + 1),
          errors: [||],
        }
      | (true, false, true) => {
          metas: shitpile |> Js.Array.slice(~start=0, ~end_=indexOfErrors),
          warnings: [||],
          errors: shitpile |> Js.Array.sliceFrom(indexOfErrors + 1),
        }
      | (true, false, false) => {
          metas: shitpile,
          warnings: [||],
          errors: [||],
        }
      | (false, true, true) => {
          metas: [||],
          warnings: shitpile |> Js.Array.slice(~start=0, ~end_=indexOfErrors),
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
      | (false, false, false) => {metas: [||], warnings: [||], errors: [||]}
      };
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
               getWithDefault(getWithDefault("0", captured[7]), captured[3])
               |> int_of_string;
             let rowEnd =
               getWithDefault(getWithDefault("0", captured[7]), captured[5])
               |> int_of_string;
             let colStart =
               getWithDefault(getWithDefault("0", captured[8]), captured[4])
               |> int_of_string;
             let colEnd =
               getWithDefault(getWithDefault("0", captured[9]), captured[6])
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
  let output: parser(output) =
    String(
      raw => {
        let rangeRe = [%re
          "/\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]$/"
        ];
        let hasRange = Js.Re.test(raw, rangeRe);
        if (hasRange) {
          raw |> parse(outputWithRange);
        } else {
          raw |> parse(outputWithoutRange);
        };
      },
    );
  let allGoalsWarnings = (title, body) : allGoalsWarnings => {
    let preprocessed = allGoalsWarningsPreprocess(title, body);
    let indexOfHiddenMetas =
      preprocessed.metas
      |> Js.Array.findIndex(s =>
           s |> parse(outputWithRange) |> Js.Option.isSome
         );
    let interactionMetas =
      preprocessed.metas
      |> Js.Array.slice(~start=0, ~end_=indexOfHiddenMetas)
      |> parseArray(outputWithoutRange);
    let hiddenMetas =
      preprocessed.metas
      |> Js.Array.sliceFrom(indexOfHiddenMetas)
      |> parseArray(outputWithRange);
    {
      interactionMetas,
      hiddenMetas,
      warnings: preprocessed.warnings,
      errors: preprocessed.errors,
    };
  };
  let goalTypeContext: string => goalTypeContext =
    body => {
      let shitpile = body |> Js.String.split("\n") |> unindent;
      /* see if Have: exists */
      let haveExists =
        shitpile
        |>
        Js.Array.findIndex(s =>
          s |> Js.String.match([%re "/^Have/"]) |> Js.Option.isSome
        ) !== (-1);
      let indexOfDelimeter =
        shitpile
        |> Js.Array.findIndex(s =>
             s |> Js.String.match([%re "/\\u2014{60}/g"]) |> Js.Option.isSome
           );
      let goal =
        shitpile[0]
        |> Js.String.sliceToEnd(~from=5)
        |> parse(expr)
        |> map(x => Goal(x));
      let have =
        haveExists ?
          shitpile[1]
          |> Js.String.sliceToEnd(~from=5)
          |> parse(expr)
          |> map(x => Have(x)) :
          None;
      let interactionMetas =
        shitpile
        |> Js.Array.sliceFrom(indexOfDelimeter + 1)
        |> parseArray(outputWithoutRange);
      let hiddenMetas =
        shitpile
        |> Js.Array.sliceFrom(indexOfDelimeter + 1)
        |> parseArray(outputWithRange);
      {goal, have, interactionMetas, hiddenMetas};
    };
  let constraints: string => array(output) =
    body => {
      let shitpile = body |> Js.String.split("\n") |> unindent;
      shitpile |> parseArray(output);
    };
};
