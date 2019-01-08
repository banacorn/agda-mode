open Atom;

open Rebase;

type t = {
  textEditor: TextEditor.t,
  index: option(int),
  mutable range: Range.t,
  marker: DisplayMarker.t,
  mutable content: string,
  mutable disposables: CompositeDisposable.t,
};
/* restore the content of the hole in the range */
let restoreBoundary = (self, range) => {
  /* asasdasd */
  self.textEditor
  |> TextEditor.setTextInBufferRange(range, self.content)
  |> ignore;
};

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
let writeLines = (self, contents: list(string)) => {
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
      switch (Js.String.match([%re "/^(\\s)*/"], firstRow)) {
      | None => ""
      | Some(matches) =>
        switch (matches[0]) {
        | None => ""
        | Some(spaces) => spaces
        }
      };
    let indentedContents =
      contents
      |> List.map(line => indentSpaces ++ line)
      |> String.joinWith("\n");

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

/* rewrite lambda expression
   aside from the goal itself, its clauses also need to be rewritten */
let writeLambda = (self, contents: list(string)) => {
  /* range to scan */
  let textBuffer = self.textEditor |> TextEditor.getBuffer;
  let beforeRange =
    Range.make(
      textBuffer |> TextBuffer.getFirstPosition,
      self.range |> Range.start,
    );
  let afterRange =
    Range.make(
      self.range |> Range.end_,
      textBuffer |> TextBuffer.getEndPosition,
    );

  /* scan and build the range to replace text with */
  self.textEditor
  |> TextEditor.backwardsScanInBufferRange(
       [%re "/\\;\\s*|\\{\\s*/"],
       beforeRange,
       result => {
         let rewriteRangeStart = result##range |> Range.end_;
         result##stop();
         self.textEditor
         |> TextEditor.scanInBufferRange(
              [%re "/\\s*\\;|\\s*\\}/"],
              afterRange,
              result => {
                let rewriteRangeEnd = result##range |> Range.start;
                result##stop();
                let rewriteRange =
                  Range.make(rewriteRangeStart, rewriteRangeEnd);
                self.textEditor
                |> TextEditor.setTextInBufferRange(
                     rewriteRange,
                     contents |> String.joinWith(" ; "),
                   )
                |> ignore;
              },
            );
       },
     );
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
  element |> Element.classList |> DomTokenList.add("agda-mode");
  /* adjusting the position of the overlay */
  /* setStyle is not supported by Reason Webapi for the moment, so we use setAttribute instead */
  element
  |> Element.setAttribute(
       "style",
       "left: " ++ string_of_int(- indexWidth - 2) ++ "ex",
     );
  element |> Element.setAttribute("style", "top: -1.5em");
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
         |> DisplayMarker.setBufferRange'(t.range, {"reversed": false});
       };
     })
  |> CompositeDisposable.add(disposables);
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
