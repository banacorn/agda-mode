module Parser = {
  open Util.Re_;
  open Js.Option;
  open Type.Interaction.Emacs;
  type allGoalsWarningsOld = {
    metas: array(string),
    warnings: array(string),
    errors: array(string),
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
  let allGoalsWarningsOld: (string, string) => allGoalsWarningsOld =
    (title, body) => {
      let shitpile = body |> Js.String.split("\n") |> concatLines;
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
  let exprs =
    String(
      raw =>
        raw
        /*                            1         2         */
        |> Js.String.splitByRe([%re "/(\\?\\d+)|(\\_[^\\.][^\\}\\)\\s]*)/"])
        |> (
          tokens =>
            tokens
            |> Js.Array.mapi((token, i) =>
                 switch (i) {
                 | 1 => QuestionMark(token)
                 | 2 => Underscore(token)
                 | _ => Plain(token)
                 }
               )
            |> (x => Some(x))
        ),
    );
  module Meta = {
    let ofType =
      Regex(
        [%re "/^([^\\:]*) \\: ((?:\\n|.)+)/"],
        captured =>
          captured[1]
          |> andThen((. term) =>
               captured[2]
               |> andThen((. type_) =>
                    term
                    |> parse(exprs)
                    |> andThen((. term') =>
                         type_
                         |> parse(exprs)
                         |> andThen((. type_') =>
                              Some(OfType(term', type_'))
                            )
                       )
                  )
             ),
      );
    let justType =
      Regex(
        [%re "/^Type ((?:\\n|.)+)/"],
        captured =>
          captured[1]
          |> andThen((. type_) =>
               type_
               |> parse(exprs)
               |> andThen((. type_') => Some(JustType(type_')))
             ),
      );
    let justSort =
      Regex(
        [%re "/^Sort ((?:\\n|.)+)/"],
        captured =>
          captured[1]
          |> andThen((. sort) =>
               sort
               |> parse(exprs)
               |> andThen((. sort') => Some(JustSort(sort')))
             ),
      );
    let others =
      String(
        raw =>
          raw |> parse(exprs) |> andThen((. raw') => Some(Others(raw'))),
      );
    let all = choice([|ofType, justType, justSort, others|]);
  };
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
         |> parse(Meta.all)
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
      |> Array.map(raw =>
           raw
           |> parse(
                choice([|
                  Regex(
                    [%re
                      "/((?:\\n|.)*\\S+)\\s*\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]/"
                    ],
                    occurence,
                  ),
                  String(
                    raw =>
                      raw
                      |> parse(Meta.all)
                      |> andThen((. x) => Some(NotHiddenMeta(x))),
                  ),
                |]),
              )
         );
    Js.log(metas);
    /* metas
       |> Util.Array_.catMaybes
       |> List.map(hm =>
            switch (hm) {
            | IsHiddenMeta(oc, _) => oc
            | NotHiddenMeta(oc) => oc
            }
          )
       |> List.map(meta =>
            switch (meta) {
            | OfType(term, type_) => type_ |> parse(expr) |> Js.log
            | JustType(type_) => ()
            | JustSort(sort) => ()
            | Others(term) => ()
            }
          ); */
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
};

let jsParseAllGoalsWarningsOld = Parser.allGoalsWarningsOld;

let jsParseAllGoalsWarnings = Parser.allGoalsWarnings;

let jsParseGoalTypeContext = Parser.goalTypeContext;

let jsConcatLines = Parser.concatLines;
