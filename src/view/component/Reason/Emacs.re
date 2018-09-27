module Parser = {
  type allGoalsWarnings = {
    metas: array(string),
    warnings: array(string),
    errors: array(string),
  };
  let allGoalsWarnings: (string, string) => allGoalsWarnings =
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
};

let jsParseAllGoalsWarnings = Parser.allGoalsWarnings;

let jsParseGoalTypeContext = Parser.goalTypeContext;
