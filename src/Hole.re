open Rebase;

type tokenType =
  | AgdaRaw
  | Literate
  | Comment
  | GoalBracket
  /* QM: Question marks  */
  | GoalQMRaw
  | GoalQM;

type token = {
  content: string,
  range: (int, int),
  type_: tokenType,
};

module Lexer = {
  type t = array(token);
  /* return */
  let make = (raw: string): t => {
    [|{content: raw, range: (0, String.length(raw)), type_: AgdaRaw}|];
  };
  /* >== */
  /* break tokens down into smaller pieces

     regex     : regex to perform split on a token
     sourceType: the type of token to look for and perform splitting
     targetType: the type of token given to the splitted tokens when identified */
  let lex = (regex: Js.Re.t, source: tokenType, target: tokenType, self): t => {
    let f = token =>
      if (token.type_ === source) {
        let cursor = ref(token.range |> fst);
        let result =
          token.content
          |> Js.String.splitByRe(regex)
          |> Array.filterMap(x => x)
          |> Array.map(content => {
               let type_ = Js.Re.test_(regex, content) ? target : source;
               let cursorOld = cursor^;
               cursor := cursor^ + String.length(content);
               {content, range: (cursorOld, cursor^), type_};
             });
        result;
      } else {
        [|token|];
      };
    self |> Array.flatMap(f);
  };

  let map = (f: token => token, self): t => {
    let delta = ref(0);
    self
    |> Array.map(token => {
         let {content, type_} = f(token);
         let (start, end_) = token.range;
         let lengthDiff =
           String.length(content) - String.length(token.content);
         let result = {
           content,
           range: (start + delta^, end_ + delta^ + lengthDiff),
           type_,
         };
         delta := delta^ + lengthDiff;
         result;
       });
  };

  let mapOnly = (type_: tokenType, f: token => token, self): t => {
    self |> map(token => token.type_ === type_ ? f(token) : token);
  };
};
module Regex = {
  let texBegin = [%re "/\\\\begin\\{code\\}.*/"];
  let texEnd = [%re "/\\\\end\\{code\\}.*/"];
  let markdown = [%re "/\\`\\`\\`(agda)?/"];
  let comment = [%re
    "/(--[^\\r\\n]*[\\r\\n])|(\\{-(?:[^-]|[\\r\\n]|(?:-+(?:[^-\\}]|[\\r\\n])))*-+\\})/"
  ];
  let goalBracket = [%re "/(\\{\\!(?:(?!\\!\\})(?:.|\\s))*\\!\\})/"];
  let goalQuestionMarkRaw = [%re "/([\\s\\(\\{\\_\\;\\.\\\"@]\\?)/"];
  let goalQuestionMark = [%re "/(\\?)/"];
  let goalBracketContent = [%re "/\\{\\!((?:(?!\\!\\})(?:.|\\s))*)\\!\\}/"];
};

type result = {
  index: int,
  modifiedRange: (int, int),
  originalRange: (int, int),
  content: string,
};
let isHole = token =>
  switch (token.type_) {
  | GoalBracket
  | GoalQM => true
  | _ => false
  };
let toLines = raw => {
  let cursor = ref(0);
  Js.String.match(
    [%re "/(.*(?:\\r\\n|[\\n\\v\\f\\r\\x85\\u2028\\u2029])?)/g"],
    raw,
  )
  |> Option.mapOr(
       lines =>
         lines
         |> Array.filter(x => !String.isEmpty(x))
         |> Array.map(line => {
              let cursorOld = cursor^;
              cursor := cursor^ + String.length(line);
              {
                content:
                  raw |> Js.String.substring(~from=cursorOld, ~to_=cursor^),
                range: (cursorOld, cursor^),
                type_: Literate,
              };
            }),
       [||],
     );
};
let filterOutTex = raw => {
  let insideAgda = ref(false);
  raw
  |> toLines
  |> Array.map(token => {
       let {content, range} = token;
       /* flip `insideAgda` to `false` after "end{code}" */
       if (Js.Re.test_(Regex.texEnd, content)) {
         insideAgda := false;
       };
       let type_ = insideAgda^ ? AgdaRaw : Literate;
       /* flip `insideAgda` to `true` after "begin{code}" */
       if (Js.Re.test_(Regex.texBegin, content)) {
         insideAgda := true;
       };
       {content, type_, range};
     });
};

let filterOutMarkdown = raw => {
  let insideAgda = ref(false);
  raw
  |> toLines
  |> Array.map(token => {
       let {content, range} = token;
       /* leaving Agda code */
       if (insideAgda^ && Js.Re.test_(Regex.markdown, content)) {
         insideAgda := false;
       };
       let type_ = insideAgda^ ? AgdaRaw : Literate;
       /* entering Agda code */
       if (! insideAgda^ && Js.Re.test_(Regex.markdown, content)) {
         insideAgda := true;
       };
       {content, type_, range};
     });
};
let parse =
    (raw: string, indices: array(int), fileType: Goal.FileType.t)
    : array(result) => {
  /* counter for indices */
  let i = ref(0);
  let preprocessed =
    switch (fileType) {
    | LiterateTeX => filterOutTex(raw)
    | LiterateMarkdown => filterOutMarkdown(raw)
    | _ => Lexer.make(raw)
    };
  /* just lexing, doesn't mess around with raw text, preserves positions */
  let original =
    preprocessed
    |> Lexer.lex(Regex.comment, AgdaRaw, Comment)
    |> Lexer.lex(Regex.goalBracket, AgdaRaw, GoalBracket)
    |> Lexer.lex(Regex.goalQuestionMarkRaw, AgdaRaw, GoalQMRaw)
    |> Lexer.lex(Regex.goalQuestionMark, GoalQMRaw, GoalQM);
  let questionMark2GoalBracket = token => {
    /* ? => {!  !} */

    content: "{!   !}",
    range: token.range,
    type_: GoalBracket,
  };
  let adjustGoalBracket = (token: token) => {
    /* {!!} => {!   !} */

    /* in case that the goal index wasn't given, make it '*' */
    /* this happens when splitting case, agda2-goals-action is one index short */
    let goalIndex =
      switch (indices[i^]) {
      | Some(idx) => string_of_int(idx)
      | None => "*"
      };

    /* {! zero 42!}
         <------>    hole content
               <>    index
              <->    space for index
       */

    /* calculate how much space the index would take */
    let requiredSpaces = String.length(goalIndex);

    /* calculate how much space we have */
    let content: string =
      Js.Re.exec_(Regex.goalBracketContent, token.content)
      |> Option.flatMap(result =>
           Js.Re.captures(result)[1]
           |> Option.map(Js.Nullable.toOption)
           |> Option.flatten
         )
      |> Option.getOr("");
    let actualSpaces =
      content
      |> Js.String.match([%re "/\\s*$/"])
      |> Option.flatMap(matches => matches[0] |> Option.map(String.length))
      |> Option.getOr(0);

    /* make room for the index, if there's not enough space */
    let newContent =
      if (actualSpaces < requiredSpaces) {
        let padding = Js.String.repeat(requiredSpaces - actualSpaces, "");
        token.content
        |> Js.String.replaceByRe(
             [%re "/\\{!.*!\\}/"],
             "{!" ++ content ++ padding ++ "!}",
           );
      } else {
        token.content;
      };

    /* update the index */
    i := i^ + 1;
    {content: newContent, type_: GoalBracket, range: (1, 2)};
  };
  let modified =
    original
    |> Lexer.mapOnly(GoalQM, questionMark2GoalBracket)
    |> Lexer.mapOnly(GoalBracket, adjustGoalBracket);
  let originalHoles = original |> Array.filter(isHole);
  let modifiedHoles = modified |> Array.filter(isHole);

  originalHoles
  |> Array.mapi((token: token, idx) =>
       switch (modifiedHoles[idx], indices[idx]) {
       | (Some(modifiedHole), Some(index)) =>
         let (start, _) = modifiedHole.range;
         Some({
           index,
           originalRange: (start, start + String.length(token.content)),
           modifiedRange: modifiedHole.range,
           content: modifiedHole.content,
         });
       | _ => None
       }
     )
  |> Array.filterMap(x => x);
};