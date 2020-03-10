open Atom;
open Rebase;

[@bs.deriving accessors]
type t = {
  textEditor: TextEditor.t,
  index: int,
  mutable range: Range.t,
  marker: DisplayMarker.t,
  mutable content: string,
  mutable disposables: CompositeDisposable.t,
};
type goal = t;
module FileType = {
  type t =
    | Agda
    | LiterateTeX
    | LiterateReStructuredText
    | LiterateMarkdown;
  let parse = filepath =>
    if (Js.Re.test_([%re "/\\.lagda.rst$/i"], Parser.filepath(filepath))) {
      LiterateReStructuredText;
    } else if (Js.Re.test_(
                 [%re "/\\.lagda.md$/i"],
                 Parser.filepath(filepath),
               )) {
      LiterateMarkdown;
    } else if (Js.Re.test_(
                 [%re "/\\.lagda.tex$|\\.lagda$/i"],
                 Parser.filepath(filepath),
               )) {
      LiterateTeX;
    } else {
      Agda;
    };
};

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
let writeLines = (contents: array(string), self) => {
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

let writeLambda = (contents: array(string), self) => {
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
let make = (textEditor: TextEditor.t, index: int, range: (int, int)) => {
  /* range */
  let (start, end_) = range;
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
  let (indexWidth, indexText) = (
    String.length(string_of_int(index)),
    string_of_int(index),
  );
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
       TextEditor.decorateMarkerOptions(
         ~type_="highlight",
         ~class_="goal",
         (),
       ),
     )
  |> ignore;
  textEditor
  |> TextEditor.decorateMarker(
       marker,
       TextEditor.decorateMarkerOptions(
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

let setContent = (text, self) => {
  let range =
    self.range |> Range.translate(Point.make(0, 2), Point.make(0, -2));

  let paddingSpaces =
    Js.String.repeat(String.length(string_of_int(self.index)), " ");

  self.textEditor
  |> TextEditor.setTextInBufferRange(
       range,
       " " ++ text ++ " " ++ paddingSpaces,
     );
};

let selectContent = self => {
  let indexWidth = String.length(string_of_int(self.index));
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
