open Util;

module Parser = {
  open Util.Re_;
  open Js.Option;
  type allGoalsWarningsOld = {
    metas: array(string),
    warnings: array(string),
    errors: array(string),
  };
  let allGoalsWarningsOld: (string, string) => allGoalsWarningsOld =
    (title, body) => {
      let shitpile = body |> Js.String.split("\n");
      let hasMetas = title |> Js.String.match([%re "/Goals/"]) |> isSome;
      let hasWarnings =
        title |> Js.String.match([%re "/Warnings/"]) |> isSome;
      let hasErrors = title |> Js.String.match([%re "/Errors/"]) |> isSome;
      let indexOfWarnings =
        shitpile
        |> Js.Array.findIndex(s =>
             s
             |> Js.String.slice(~from=5, ~to_=13)
             |> Js.String.match([%re "/Warnings/"])
             |> isSome
           );
      let indexOfErrors =
        shitpile
        |> Js.Array.findIndex(s =>
             s
             |> Js.String.slice(~from=5, ~to_=11)
             |> Js.String.match([%re "/Errors/"])
             |> isSome
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
  let filepath = raw => {
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
      joined |> sliceToEnd(~from=1) |> trim;
    } else {
      joined |> trim;
    };
  };
  /* let outputConstraint = raw => (); */
  module OutputConstraint = {
    open Type.Interaction;
    let ofType =
      Regex(
        [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"],
        captured =>
          captured[1]
          |> andThen((. term) =>
               captured[2]
               |> andThen((. type_) => Some(OfType(term, type_)))
             ),
      );
    let justType =
      Regex(
        [%re "/^Type ((?:\\n|.)+)/"],
        captured =>
          captured[1] |> andThen((. type_) => Some(JustType(type_))),
      );
    let justSort =
      Regex(
        [%re "/^Sort ((?:\\n|.)+)/"],
        captured =>
          captured[1] |> andThen((. type_) => Some(JustSort(type_))),
      );
    let others = Wildcard(raw => Some(EmacsWildcard(raw)));
    let all = choice([|ofType, justType, justSort, others|]);
  };
  type isHiddenMeta =
    | IsHiddenMeta(
        Type.Interaction.outputConstraint(string, string),
        Type.Syntax.Position.range,
      )
    | NotHiddenMeta(Type.Interaction.outputConstraint(string, string));
  let occurence = (captured: array(option(string))) : option(isHiddenMeta) =>
    captured[1]
    |> andThen((. meta) => {
         open Type.Syntax.Position;
         Js.log(captured);
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
         meta
         |> OutputConstraint.all
         |> andThen((. parsedOutputConstraint) =>
              Some(
                IsHiddenMeta(
                  parsedOutputConstraint,
                  Range(
                    map((. x) => filepath(x), captured[2]),
                    [{start, end_}],
                  ),
                ),
              )
            );
       });
  let allGoalsWarnings = (title, body) => {
    let metas =
      allGoalsWarningsOld(title, body).metas
      |> Array.map(
           Re_.choice([|
             Regex(
               [%re
                 "/((?:\\n|.)*\\S+)\\s*\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]/"
               ],
               occurence,
             ),
           |]),
         );
    /* let metas =
       allGoalsWarningsOld(title, body).metas
       |> Array.map(raw => {
            let result =
              Re_.captures(
                [%re
                  "/((?:\\n|.)*\\S+)\\s*\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]/"
                ],
                raw,
              );
            switch (result) {
            | Some(captured) =>
              switch (captured[1]) {
              | Some(meta) =>
                open Js.Option;
                open Type.Syntax.Position;
                Js.log(captured);
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
                IsHiddenMeta(
                  meta,
                  Range(
                    map((. x) => filepath(x), captured[2]),
                    [{start, end_}],
                  ),
                );
              }
            | None => NotHiddenMeta(raw)
            };
          }); */
    Js.log(metas);
  };
  type goalTypeContext = {
    goal: string,
    have: option(string),
    metas: array(string),
  };
  let goalTypeContext: string => goalTypeContext =
    body => {
      let shitpile = body |> Js.String.split("\n");
      let indexOfHave =
        shitpile
        |> Js.Array.findIndex(s =>
             s |> Js.String.match([%re "/^Have/"]) |> isSome
           );
      let indexOfDelimeter =
        shitpile
        |> Js.Array.findIndex(s =>
             s |> Js.String.match([%re "/\\u2014{60}/g"]) |> isSome
           );
      let parseGoalOrHave = lines =>
        lines
        |> Array.to_list
        |> String.concat("\n")
        |> Js.String.sliceToEnd(~from=5);
      if (indexOfHave === (-1)) {
        {
          goal:
            shitpile
            |> Js.Array.slice(~start=0, ~end_=indexOfDelimeter)
            |> parseGoalOrHave,
          have: None,
          metas: shitpile |> Js.Array.sliceFrom(indexOfDelimeter + 1),
        };
      } else {
        {
          goal:
            shitpile
            |> Js.Array.slice(~start=0, ~end_=indexOfHave)
            |> parseGoalOrHave,
          have:
            shitpile
            |> Js.Array.slice(~start=indexOfHave, ~end_=indexOfDelimeter)
            |> parseGoalOrHave
            |> (x => Some(x)),
          metas: shitpile |> Js.Array.sliceFrom(indexOfDelimeter + 1),
        };
      };
    };
  let concatLines: array(string) => array(string) =
    lines => {
      let isNewline = (line, nextLine) => {
        let sort = [%re "/^Sort \\S*/"];
        /* banana : Banana */
        let completeJudgement = [%re "/^[^\\(\\{\\s]+\\s+\\:\\s* \\S*/"];
        /* case when the term's name is too long, the rest of the judgement
              would go to the next line, e.g:
                   banananananananananananananananana
                       : Banana
           */
        let reallyLongTermIdentifier = [%re "/^\\S+$/"];
        let restOfTheJudgement = [%re "/^\\s*\\:\\s* \\S*/"];
        Js.Re.test(line, sort)
        || Js.Re.test(line, reallyLongTermIdentifier)
        && isSomeValue(
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
             (index, Array.length(newLineIndices) + 1);
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
};

let jsParseAllGoalsWarningsOld = Parser.allGoalsWarningsOld;

let jsParseAllGoalsWarnings = Parser.allGoalsWarnings;

let jsParseGoalTypeContext = Parser.goalTypeContext;

let jsConcatLines = Parser.concatLines;
