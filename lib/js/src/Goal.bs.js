// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE
'use strict';

var Atom = require("atom");
var $$String = require("bs-platform/lib/js/string.js");
var Belt_Array = require("bs-platform/lib/js/belt_Array.js");
var Util$AgdaMode = require("./Util/Util.bs.js");
var Parser$AgdaMode = require("./Parser.bs.js");
var Caml_splice_call = require("bs-platform/lib/js/caml_splice_call.js");

function restoreBoundary(self, range) {
  self.textEditor.setTextInBufferRange(range, self.content);
  return /* () */0;
}

function removeBoundary(self) {
  var range = self.range.translate(new Atom.Point(0, 2), new Atom.Point(0, -2));
  var content = $$String.trim(self.textEditor.getTextInBufferRange(range));
  self.textEditor.setTextInBufferRange(self.range, content);
  return /* () */0;
}

function writeLines(contents, self) {
  var textBuffer = self.textEditor.getBuffer();
  var rowNumbers = self.range.getRows();
  var match = Belt_Array.get(rowNumbers, 0);
  if (match !== undefined) {
    var firstRowNumber = match;
    var firstRowRange = textBuffer.rangeForRow(firstRowNumber, false);
    var firstRow = self.textEditor.getTextInBufferRange(firstRowRange);
    var indentSpaces = " ".repeat(Util$AgdaMode.$$String.indentedBy(firstRow));
    var indentedContents = Caml_splice_call.spliceObjApply("", "concat", [Belt_Array.map(contents, (function (line) {
                  return indentSpaces + (line + "\n");
                }))]);
    var match$1 = Belt_Array.get(rowNumbers, rowNumbers.length - 1 | 0);
    if (match$1 !== undefined) {
      textBuffer.deleteRows(firstRowNumber, match$1);
    }
    var position = firstRowRange.start;
    textBuffer.insert(position, indentedContents);
    return /* () */0;
  } else {
    return /* () */0;
  }
}

function writeLambda(contents, self) {
  var scanRow = self.range.start.row;
  var scanRowText = self.textEditor.getTextInBufferRange(new Atom.Range(new Atom.Point(scanRow, 0), self.range.start));
  var indent = Util$AgdaMode.$$String.indentedBy(scanRowText);
  var match = Util$AgdaMode.$$String.lastIndexOf(";", scanRowText);
  var scanColStart = match !== undefined ? match + 1 | 0 : indent;
  var scanColEnd = self.range.start.column;
  var bracketCount = 0;
  var i = scanColEnd - 1 | 0;
  while(i >= scanColStart && bracketCount >= 0) {
    var i$prime = i;
    if (i$prime !== 0) {
      var match$1 = scanRowText.charAt(i$prime - 1 | 0);
      switch (match$1) {
        case "{" :
            bracketCount = bracketCount - 1 | 0;
            break;
        case "}" :
            bracketCount = bracketCount + 1 | 0;
            break;
        default:
          
      }
    }
    i = i - 1 | 0;
  };
  var rewriteRangeStart = new Atom.Point(scanRow, i + 1 | 0);
  var rewriteRangeEnd = self.range.end;
  var rewriteRange = new Atom.Range(rewriteRangeStart, rewriteRangeEnd);
  var isLambdaWhere = (i + 1 | 0) === indent;
  if (isLambdaWhere) {
    self.textEditor.setTextInBufferRange(rewriteRange, Caml_splice_call.spliceObjApply("\n" + " ".repeat(indent), "concat", [contents]));
    return /* () */0;
  } else {
    self.textEditor.setTextInBufferRange(rewriteRange, " " + Caml_splice_call.spliceObjApply(" ; ", "concat", [contents]));
    return /* () */0;
  }
}

function destroy(self) {
  self.marker.destroy();
  self.disposables.dispose();
  return /* () */0;
}

function make(textEditor, index, range) {
  var textBuffer = textEditor.getBuffer();
  var startPoint = textBuffer.positionForCharacterIndex(range[0]);
  var endPoint = textBuffer.positionForCharacterIndex(range[1]);
  var range$1 = new Atom.Range(startPoint, endPoint);
  var content = textBuffer.getTextInRange(range$1);
  var marker = textEditor.markBufferRange(range$1);
  var disposables = new Atom.CompositeDisposable();
  var t = {
    textEditor: textEditor,
    index: index,
    range: range$1,
    marker: marker,
    content: content,
    disposables: disposables
  };
  var indexWidth = String(index).length;
  var indexText = String(index);
  var element = document.createElement("div");
  element.innerHTML = indexText;
  element.classList.add("goal-index");
  element.setAttribute("style", "left: " + (String((-indexWidth | 0) - 2 | 0) + "ex ; top: -1.5em"));
  textEditor.decorateMarker(marker, {
        type: "highlight",
        class: "goal"
      });
  textEditor.decorateMarker(marker, {
        type: "overlay",
        item: element,
        position: "head"
      });
  disposables.add(marker.onDidChange((function (_event) {
              var newRange = marker.getBufferRange();
              var newContent = textBuffer.getTextInRange(newRange);
              var deltaLeft = Util$AgdaMode.$$String.indexOf("{!", newContent);
              var deltaRight = Util$AgdaMode.$$String.lastIndexOf("!}", newContent);
              if (deltaLeft !== undefined) {
                var left = deltaLeft;
                if (left === 0 && deltaRight === 1) {
                  return restoreBoundary(t, newRange);
                }
                if (deltaRight !== undefined) {
                  var right$prime = (deltaRight - newContent.length | 0) + 2 | 0;
                  t.range = newRange.translate(new Atom.Point(0, left), new Atom.Point(0, right$prime));
                  t.content = textBuffer.getTextInRange(t.range);
                  t.marker.setBufferRange(t.range, {
                        reversed: false
                      });
                  return /* () */0;
                } else {
                  return restoreBoundary(t, newRange);
                }
              } else if (deltaRight !== undefined) {
                return restoreBoundary(t, newRange);
              } else {
                return destroy(t);
              }
            })));
  return t;
}

function getContent(self) {
  var range = self.range.translate(new Atom.Point(0, 2), new Atom.Point(0, -2));
  return Parser$AgdaMode.userInput(self.textEditor.getTextInBufferRange(range));
}

function setContent(text, self) {
  var range = self.range.translate(new Atom.Point(0, 2), new Atom.Point(0, -2));
  var paddingSpaces = " ".repeat(String(self.index).length);
  return self.textEditor.setTextInBufferRange(range, " " + (text + (" " + paddingSpaces)));
}

function selectContent(self) {
  var indexWidth = String(self.index).length;
  var range = self.range.translate(new Atom.Point(0, 3), new Atom.Point(0, -(3 + indexWidth | 0) | 0));
  self.textEditor.setSelectedBufferRange(range, {
        reversed: false,
        preserveFolds: true
      });
  return /* () */0;
}

function isEmpty(self) {
  return getContent(self).replace(/(\s|\\n)*/, "") === "";
}

function buildHaskellRange(old, filepath, self) {
  var start = self.range.start;
  var startIndex = self.textEditor.getBuffer().characterIndexForPosition(start);
  var end_ = self.range.end;
  var endIndex = self.textEditor.getBuffer().characterIndexForPosition(end_);
  var startIndex$prime = String(startIndex + 3 | 0);
  var startRow = String(start.row + 1 | 0);
  var startColumn = String(start.column + 3 | 0);
  var startPart = "" + (String(startIndex$prime) + (" " + (String(startRow) + (" " + (String(startColumn) + "")))));
  var endIndex$prime = String(endIndex - 3 | 0);
  var endRow = String(end_.row + 1 | 0);
  var endColumn = String(end_.column - 1 | 0);
  var endPart = "" + (String(endIndex$prime) + (" " + (String(endRow) + (" " + (String(endColumn) + "")))));
  if (old) {
    return "(Range [Interval (Pn (Just (mkAbsolute \"" + (String(filepath) + ("\")) " + (String(startPart) + (") (Pn (Just (mkAbsolute \"" + (String(filepath) + ("\")) " + (String(endPart) + ")])")))))));
  } else {
    return "(intervalsToRange (Just (mkAbsolute \"" + (String(filepath) + ("\")) [Interval (Pn () " + (String(startPart) + (") (Pn () " + (String(endPart) + ")])")))));
  }
}

exports.restoreBoundary = restoreBoundary;
exports.removeBoundary = removeBoundary;
exports.writeLines = writeLines;
exports.writeLambda = writeLambda;
exports.destroy = destroy;
exports.make = make;
exports.getContent = getContent;
exports.setContent = setContent;
exports.selectContent = selectContent;
exports.isEmpty = isEmpty;
exports.buildHaskellRange = buildHaskellRange;
/* atom Not a pure module */