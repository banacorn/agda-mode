open Util;

module Parser = {
  type allGoalsWarningsOld = {
    metas: array(string),
    warnings: array(string),
    errors: array(string),
  };
  let allGoalsWarningsOld: (string, string) => allGoalsWarningsOld =
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
  let allGoalsWarnings = (title, body) => {
    let metas = allGoalsWarningsOld(title, body).metas;
    let hiddenMetas =
      metas
      |> Array.map(
           Re_.captures(
             [%re
               "/((?:\\n|.)*\\S+)\\s*\\[ at (.+):(?:(\\d+)\\,(\\d+)\\-(\\d+)\\,(\\d+)|(\\d+)\\,(\\d+)\\-(\\d+)) \\]/"
             ],
           ),
         )
      |> Array_.catMaybes
      |> List.map(result => {
           open Js.Option;
           open Type.Syntax.Position;
           Js.log(result);
           let rowStart =
             default(default("0", result[7]), result[3]) |> int_of_string;
           let rowEnd =
             default(default("0", result[7]), result[5]) |> int_of_string;
           let colStart =
             default(default("0", result[8]), result[4]) |> int_of_string;
           let colEnd =
             default(default("0", result[9]), result[6]) |> int_of_string;
           /* Js.log((rowStart, colStart, rowEnd, colEnd)); */
           /* Js.log(Some(3) |> getExn); */
           3;
         });
    Js.log(hiddenMetas);
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
             s |> Js.String.match([%re "/^Have/"]) |> Js.Option.isSome
           );
      let indexOfDelimeter =
        shitpile
        |> Js.Array.findIndex(s =>
             s |> Js.String.match([%re "/\\u2014{60}/g"]) |> Js.Option.isSome
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
