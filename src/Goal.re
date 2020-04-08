open Belt;
open! Atom;

type t = {
  textEditor: TextEditor.t,
  index: int,
  mutable range: Range.t,
  marker: DisplayMarker.t,
  mutable content: string,
  mutable disposables: CompositeDisposable.t,
};

/* restore the content of the hole in the range */
let restoreBoundary = (self, range) => {
  TextEditor.setTextInBufferRange(range, self.content, self.textEditor)
  |> ignore;
};

let removeBoundary = self => {
  let range =
    self.range |> Range.translate(Point.make(0, 2), Point.make(0, -2));
  let content =
    self.textEditor |> TextEditor.getTextInBufferRange(range) |> String.trim;
  TextEditor.setTextInBufferRange(self.range, content, self.textEditor)
  |> ignore;
};

/* replace and insert one or more lines of content at the goal
   usage: splitting case */
let writeLines = (contents: array(string), self) => {
  let textBuffer = TextEditor.getBuffer(self.textEditor);
  let rowNumbers = Range.getRows(self.range);
  switch (rowNumbers[0]) {
  | None => ()
  | Some(firstRowNumber) =>
    let firstRowRange =
      TextBuffer.rangeForRow(firstRowNumber, false, textBuffer);
    let firstRow =
      TextEditor.getTextInBufferRange(firstRowRange, self.textEditor);
    /* indent and join with \n */
    let indentSpaces =
      Js.String.repeat(Util.String.indentedBy(firstRow), " ");

    let indentedContents =
      contents
      ->Array.map(line => indentSpaces ++ line ++ "\n")
      ->Js.String.concatMany("");

    /* delete original rows */
    switch (rowNumbers[Array.length(rowNumbers) - 1]) {
    | None => ()
    | Some(lastRowNumber) =>
      textBuffer
      |> TextBuffer.deleteRows(firstRowNumber, lastRowNumber)
      |> ignore
    };

    /* insert case split content */
    let position = Range.start(firstRowRange);
    TextBuffer.insert(position, indentedContents, textBuffer) |> ignore;
  };
};

/* Replace definition of extended lambda with new clauses
   aside from the goal itself, its clauses also need to be rewritten */
/* https://github.com/agda/agda/blob/f46ecaf729c00217efad7a77e5d9932bfdd030e5/src/data/emacs-mode/agda2-mode.el#L950 */

let writeLambda = (contents: array(string), self) => {
  /* range to scan */
  let scanRow = Point.row(Range.start(self.range));
  let scanRowText =
    TextEditor.getTextInBufferRange(
      Range.make(Point.make(scanRow, 0), Range.start(self.range)),
      self.textEditor,
    );
  let indent = Util.String.indentedBy(scanRowText);
  /* start at the last ";", or the first non-black character if not found */
  let scanColStart =
    switch (Util.String.lastIndexOf(";", scanRowText)) {
    | Some(n) => n + 1
    | None => indent
    };

  let scanColEnd = Point.column(Range.start(self.range));
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
    TextEditor.setTextInBufferRange(
      rewriteRange,
      contents->Js.String.concatMany("\n" ++ Js.String.repeat(indent, " ")),
      self.textEditor,
    )
    |> ignore;
  } else {
    TextEditor.setTextInBufferRange(
      rewriteRange,
      " " ++ contents->Js.String.concatMany(" ; "),
      self.textEditor,
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
  let textBuffer = TextEditor.getBuffer(textEditor);
  let startPoint = TextBuffer.positionForCharacterIndex(start, textBuffer);
  let endPoint = TextBuffer.positionForCharacterIndex(end_, textBuffer);
  /* properties */
  let range = Range.make(startPoint, endPoint);
  let content = TextBuffer.getTextInRange(range, textBuffer);
  let marker = TextEditor.markBufferRange(range, textEditor);
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

  TextEditor.decorateMarker(
    marker,
    TextEditor.decorateMarkerOptions(~type_="highlight", ~class_="goal", ()),
    textEditor,
  )
  |> ignore;

  TextEditor.decorateMarker(
    marker,
    TextEditor.decorateMarkerOptions(
      ~type_="overlay",
      ~position="head",
      ~item=Element.unsafeAsHtmlElement(element),
      (),
    ),
    textEditor,
  )
  |> ignore;
  /* monitoring events */
  marker
  |> DisplayMarker.onDidChange(_event => {
       let newRange = DisplayMarker.getBufferRange(marker);

       /* positions of the boundary ot the hole*/
       let newContent = TextBuffer.getTextInRange(newRange, textBuffer);
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
         t.content = TextBuffer.getTextInRange(t.range, textBuffer);
         DisplayMarker.setBufferRange_(
           t.range,
           {"reversed": false},
           t.marker,
         );
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

  TextEditor.setTextInBufferRange(
    range,
    " " ++ text ++ " " ++ paddingSpaces,
    self.textEditor,
  );
};

let selectContent = self => {
  let indexWidth = String.length(string_of_int(self.index));
  let range =
    self.range
    |> Range.translate(Point.make(0, 3), Point.make(0, - (3 + indexWidth)));

  TextEditor.setSelectedBufferRange_(
    range,
    {"reversed": false, "preserveFolds": true},
    self.textEditor,
  );
};
let isEmpty = self => {
  Js.String.replaceByRe([%re "/(\\s|\\\\n)*/"], "", getContent(self)) == "";
};

let buildHaskellRange = (old, filepath, self) => {
  let start = Range.start(self.range);
  let startIndex =
    self.textEditor
    |> TextEditor.getBuffer
    |> TextBuffer.characterIndexForPosition(start);

  let end_ = Range.end_(self.range);
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