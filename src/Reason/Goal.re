open Atom;
open Rebase;

[@bs.deriving accessors]
type t = {
  textEditor: TextEditor.t,
  index: option(int),
  mutable range: Range.t,
  marker: DisplayMarker.t,
  mutable content: string,
  mutable disposables: CompositeDisposable.t,
};
type goal = t;
type fileType =
  | Agda
  | LiterateTeX
  | LiterateReStructuredText
  | LiterateMarkdown;
/* restore the content of the hole in the range */
let restoreBoundary = (self, range) => {
  /* asasdasd */
  self.textEditor
  |> TextEditor.setTextInBufferRange(range, self.content)
  |> ignore;
};

let string_of_index =
  fun
  | Some(i) => string_of_int(i)
  | None => "*";

let removeBoundary = self => {
  let range =
    self.range |> Range.translate(Point.make(0, 2), Point.make(0, -2));
  let content =
    self.textEditor |> TextEditor.getTextInBufferRange(range) |> String.trim;
  self.textEditor
  |> TextEditor.setTextInBufferRange(self.range, content)
  |> ignore;
};

/* replace and insert one or more lines of content at the goal
   usage: splitting case */
let writeLines = (self, contents: array(string)) => {
  let textBuffer = self.textEditor |> TextEditor.getBuffer;
  let rowNumbers = self.range |> Range.getRows;
  switch (rowNumbers[0]) {
  | None => ()
  | Some(firstRowNumber) =>
    let firstRowRange =
      textBuffer |> TextBuffer.rangeForRow(firstRowNumber, false);
    let firstRow =
      self.textEditor |> TextEditor.getTextInBufferRange(firstRowRange);
    /* indent and join with \n */
    let indentSpaces =
      Js.String.repeat(Util.String.indentedBy(firstRow), " ");

    let indentedContents =
      contents
      |> Array.map(line => indentSpaces ++ line)
      |> List.fromArray
      |> String.joinWith("\n")
      |> String.concat("\n");

    /* Js.log(indentedContents); */

    /* delete original rows */
    switch (rowNumbers[Array.length(rowNumbers) - 1]) {
    | None => ()
    | Some(lastRowNumber) =>
      textBuffer
      |> TextBuffer.deleteRows(firstRowNumber, lastRowNumber)
      |> ignore
    };

    /* insert case split content */
    let position = firstRowRange |> Range.start;
    textBuffer |> TextBuffer.insert(position, indentedContents) |> ignore;
  };
};

/* Replace definition of extended lambda with new clauses
   aside from the goal itself, its clauses also need to be rewritten */
/* https://github.com/agda/agda/blob/f46ecaf729c00217efad7a77e5d9932bfdd030e5/src/data/emacs-mode/agda2-mode.el#L950 */

let writeLambda = (self, contents: array(string)) => {
  /* range to scan */
  let scanRow = self.range |> Range.start |> Point.row;
  let scanRowText =
    self.textEditor
    |> TextEditor.getTextInBufferRange(
         Range.make(Point.make(scanRow, 0), self.range |> Range.start),
       );
  let indent = Util.String.indentedBy(scanRowText);
  /* start at the last ";", or the first non-black character if not found */
  let scanColStart =
    switch (Util.String.lastIndexOf(";", scanRowText)) {
    | Some(n) => n + 1
    | None => indent
    };

  let scanColEnd = self.range |> Range.start |> Point.column;
  /* ugly iteration  */
  let bracketCount = ref(0);
  let i = ref(scanColEnd - 1);
  while (i^ >= scanColStart && bracketCount^ >= 0) {
    switch (i^) {
    /* no preceding character */
    | 0 => ()
    /* has preceding character */
    | i' =>
      switch (Js.String.charAt(i' - 1, scanRowText)) {
      | "}" => bracketCount := bracketCount^ + 1
      | "{" => bracketCount := bracketCount^ - 1
      | _ => ()
      }
    };
    i := i^ - 1;
  };
  let rewriteRangeStart = Point.make(scanRow, i^ + 1);
  let rewriteRangeEnd = self.range |> Range.end_;
  let rewriteRange = Range.make(rewriteRangeStart, rewriteRangeEnd);
  let isLambdaWhere = i^ + 1 == indent;
  if (isLambdaWhere) {
    self.textEditor
    |> TextEditor.setTextInBufferRange(
         rewriteRange,
         contents
         |> List.fromArray
         |> String.joinWith("\n" ++ Js.String.repeat(indent, " ")),
       )
    |> ignore;
  } else {
    self.textEditor
    |> TextEditor.setTextInBufferRange(
         rewriteRange,
         " " ++ (contents |> List.fromArray |> String.joinWith(" ; ")),
       )
    |> ignore;
  };
};

let destroy = self => {
  self.marker |> DisplayMarker.destroy;
  self.disposables |> CompositeDisposable.dispose;
};

/* lots of side effects! */
let make =
    (textEditor: TextEditor.t, index: option(int), start: int, end_: int) => {
  /* range */
  let textBuffer = textEditor |> TextEditor.getBuffer;
  let startPoint = textBuffer |> TextBuffer.positionForCharacterIndex(start);
  let endPoint = textBuffer |> TextBuffer.positionForCharacterIndex(end_);
  /* properties */
  let range = Range.make(startPoint, endPoint);
  let content = textBuffer |> TextBuffer.getTextInRange(range);
  let marker = textEditor |> TextEditor.markBufferRange(range);
  let disposables = CompositeDisposable.make();
  let t = {textEditor, range, index, marker, content, disposables};
  /* overlay element */
  let (indexWidth, indexText) =
    switch (index) {
    | None => (1, "*")
    | Some(i) => (String.length(string_of_int(i)), string_of_int(i))
    };
  module Document = Webapi.Dom.Document;
  module Element = Webapi.Dom.Element;
  module DomTokenList = Webapi.Dom.DomTokenList;
  let element = Webapi.Dom.document |> Document.createElement("div");
  Element.setInnerHTML(element, indexText);
  element |> Element.classList |> DomTokenList.add("goal-index");
  /* adjusting the position of the overlay */
  /* setStyle is not supported by Reason Webapi for the moment, so we use setAttribute instead */
  element
  |> Element.setAttribute(
       "style",
       "left: " ++ string_of_int(- indexWidth - 2) ++ "ex ; top: -1.5em",
     );
  /* decorations */
  textEditor
  |> TextEditor.decorateMarker(
       marker,
       TextEditor.decorationParams(~type_="highlight", ~class_="goal", ()),
     )
  |> ignore;
  textEditor
  |> TextEditor.decorateMarker(
       marker,
       TextEditor.decorationParams(
         ~type_="overlay",
         ~position="head",
         ~item=Element.unsafeAsHtmlElement(element),
         (),
       ),
     )
  |> ignore;
  /* monitoring events */
  marker
  |> DisplayMarker.onDidChange(_event => {
       let newRange = marker |> DisplayMarker.getBufferRange;

       /* positions of the boundary ot the hole*/
       let newContent = textBuffer |> TextBuffer.getTextInRange(newRange);
       let deltaLeft = Util.String.indexOf("{!", newContent);
       let deltaRight = Util.String.lastIndexOf("!}", newContent);

       switch (deltaLeft, deltaRight) {
       | (None, None) =>
         /* the entire goal got destroyed, so be it */
         destroy(t)
       | (None, Some(_))
       | (Some(_), None) =>
         /* partially damaged, restore it  */
         restoreBoundary(t, newRange)
       | (Some(0), Some(1)) =>
         /* special case: '{!}', restore it */
         restoreBoundary(t, newRange)
       | (Some(left), Some(right)) =>
         let right' = right - String.length(newContent) + 2;
         t.range =
           newRange
           |> Range.translate(Point.make(0, left), Point.make(0, right'));
         t.content = textBuffer |> TextBuffer.getTextInRange(t.range);
         t.marker
         |> DisplayMarker.setBufferRange_(t.range, {"reversed": false});
       };
     })
  |> CompositeDisposable.add(disposables);
  t;
};

let getContent = self => {
  let range =
    self.range |> Range.translate(Point.make(0, 2), Point.make(0, -2));

  self.textEditor
  |> TextEditor.getTextInBufferRange(range)
  |> Parser.userInput;
};

let setContent = (self, text) => {
  let range =
    self.range |> Range.translate(Point.make(0, 2), Point.make(0, -2));

  let paddingSpaces =
    switch (self.index) {
    | None => " "
    | Some(i) => Js.String.repeat(String.length(string_of_int(i)), " ")
    };

  self.textEditor
  |> TextEditor.setTextInBufferRange(
       range,
       " " ++ text ++ " " ++ paddingSpaces,
     );
};

let selectContent = self => {
  let indexWidth =
    switch (self.index) {
    | None => 1
    | Some(i) => String.length(string_of_int(i))
    };
  let range =
    self.range
    |> Range.translate(Point.make(0, 3), Point.make(0, - (3 + indexWidth)));

  self.textEditor
  |> TextEditor.setSelectedBufferRange_(
       range,
       {"reversed": false, "preserveFolds": true},
     );
};
let isEmpty = self => {
  getContent(self)
  |> Js.String.replaceByRe([%re "/(\\s|\\\\n)*/"], "")
  |> String.isEmpty;
};

let buildHaskellRange = (old, filepath, self) => {
  let start = self.range |> Range.start;
  let startIndex =
    self.textEditor
    |> TextEditor.getBuffer
    |> TextBuffer.characterIndexForPosition(start);

  let end_ = self.range |> Range.end_;
  let endIndex =
    self.textEditor
    |> TextEditor.getBuffer
    |> TextBuffer.characterIndexForPosition(end_);
  ();

  let startIndex' = string_of_int(startIndex + 3);
  let startRow = string_of_int(Point.row(start) + 1);
  let startColumn = string_of_int(Point.column(start) + 3);
  let startPart = {j|$(startIndex') $(startRow) $(startColumn)|j};
  let endIndex' = string_of_int(endIndex - 3);
  let endRow = string_of_int(Point.row(end_) + 1);
  let endColumn = string_of_int(Point.column(end_) - 1);
  let endPart = {j|$(endIndex') $(endRow) $(endColumn)|j};

  if (old) {
    {j|(Range [Interval (Pn (Just (mkAbsolute "$(filepath)")) $(startPart)) (Pn (Just (mkAbsolute "$(filepath)")) $(endPart))])|j}
    /* before (not including) 2.5.1 */
  } else {
    {j|(intervalsToRange (Just (mkAbsolute "$(filepath)")) [Interval (Pn () $(startPart)) (Pn () $(endPart))])|j}
    /* after 2.5.1 */
  };
};

module Parser = {
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
  /* type hol = {
       content: string,
       range: (int, int),
       type_: tokenType,
     }; */
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
          token.content
          |> Js.String.splitByRe(regex)
          |> Array.map(content => {
               let type_ = regex |> Js.Re.test(content) ? target : source;
               let cursorOld = cursor^;
               cursor := cursor^ + String.length(content);
               {content, range: (cursorOld, cursor^), type_};
             });
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
         if (Regex.texEnd |> Js.Re.test(content)) {
           insideAgda := false;
         };
         let type_ = insideAgda^ ? AgdaRaw : Literate;
         /* flip `insideAgda` to `true` after "begin{code}" */
         if (Regex.texBegin |> Js.Re.test(content)) {
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
         if (insideAgda^ && Regex.markdown |> Js.Re.test(content)) {
           insideAgda := false;
         };
         let type_ = insideAgda^ ? AgdaRaw : Literate;
         /* entering Agda code */
         if (! insideAgda^ && Regex.markdown |> Js.Re.test(content)) {
           insideAgda := true;
         };
         {content, type_, range};
       });
  };
  /* let parse =
         (raw: string, indices: array(int), fileType: fileType): array(hole) => {
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
       let adjustGoalBracket = token => {
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
           Regex.goalBracketContent
           |> Js.Re.exec(token.content)
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

         originalHoles |> Array.mapi((token, idx) => {
           let modifiedHole = modifiedHoles[idx];


         });
     }; */
};
