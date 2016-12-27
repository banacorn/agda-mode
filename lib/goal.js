"use strict";
var _ = require("lodash");
var parser_1 = require("./parser");
var _a = require('atom'), Point = _a.Point, Range = _a.Range;
function translate(textBuffer, p, n) {
    return textBuffer.positionForCharacterIndex(textBuffer.characterIndexForPosition(p) + n);
}
function resizeRange(textBuffer, range, left, right) {
    var start = translate(textBuffer, range.start, left);
    var end = translate(textBuffer, range.end, right);
    return new Range(start, end);
}
var Goal = (function () {
    function Goal(editor, index, // -1 as Nothing, fuck TypeScript
        startIndex, endIndex) {
        if (index === void 0) { index = -1; }
        var _this = this;
        this.editor = editor;
        this.index = index;
        this.setContent = function (text) {
            var range = _this.range.translate(new Point(0, 2), new Point(0, -2));
            var indexWidth = _this.index === -1 ? 1 : _this.index.toString().length;
            var paddingSpaces = _.repeat(' ', indexWidth);
            _this.editor.setTextInBufferRange(range, " " + text + " " + paddingSpaces);
            return _this;
        };
        // initialization
        var textBuffer = this.editor.getBuffer();
        var startPoint = textBuffer.positionForCharacterIndex(startIndex);
        var endPoint = textBuffer.positionForCharacterIndex(endIndex);
        this.range = new Range(startPoint, endPoint);
        this.content = textBuffer.getTextInRange(this.range);
        this.marker = this.editor.markBufferRange(this.range, {});
        // overlay element
        var indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        var element = document.createElement('div');
        if (this.index === -1)
            element.innerHTML = '*';
        else
            element.innerHTML = this.index.toString();
        element.classList.add('agda-goal-index');
        // those measurement functions are no longer part of the public API
        // we should come up with a new way to steal those measurements
        element.style.left = -indexWidth - 2 + "ex";
        element.style.top = "-1.5em";
        // element.style.left = `${- this.editor.getDefaultCharWidth() * (indexWidth + 2)}px`;
        // element.style.top = `${- this.editor.getLineHeightInPixels()}px`;
        // decoration
        var holeDecoration = this.editor.decorateMarker(this.marker, {
            type: 'highlight',
            class: 'agda-goal'
        });
        var indexDecoration = this.editor.decorateMarker(this.marker, {
            type: 'overlay',
            position: 'head',
            item: element
        });
        // events
        this.marker.onDidChange(function (event) {
            var newRange = _this.marker.getBufferRange();
            // boundary positions
            var text = _this.editor.getBuffer().getTextInRange(newRange);
            var left = text.indexOf('{!');
            var right = text.lastIndexOf('!}');
            // special case: '{!}'
            if (left === 0 && right === 1)
                _this.restoreBoundary(newRange);
            else if (left === -1 && right === -1)
                _this.destroy();
            else if (left === -1 || right === -1) {
                _this.restoreBoundary(newRange);
            }
            else if (left !== -1 && right !== -1) {
                var textBuffer_1 = _this.editor.getBuffer();
                var contentLength = text.length;
                var stretchRight = right - contentLength + 2;
                _this.range = resizeRange(textBuffer_1, newRange, left, stretchRight);
                _this.content = textBuffer_1.getTextInRange(_this.range);
                _this.marker.setBufferRange(_this.range, {
                    reversed: false
                });
            }
            else {
                throw 'Goal: WTF!!???';
            }
        });
    }
    Goal.prototype.destroy = function () {
        this.marker.destroy();
    };
    Goal.prototype.restoreBoundary = function (newRange) {
        this.editor.setTextInBufferRange(newRange, this.content);
    };
    Goal.prototype.removeBoundary = function () {
        var textBuffer = this.editor.getBuffer();
        var range = resizeRange(textBuffer, this.range, 2, -2);
        var rawContent = this.editor.getTextInBufferRange(range);
        this.editor.setTextInBufferRange(this.range, rawContent.trim());
    };
    // replace and insert one or more lines of content at the goal
    // usage: splitting case
    Goal.prototype.writeLines = function (contents) {
        var textBuffer = this.editor.getBuffer();
        var rows = this.range.getRows();
        var firstRowRange = textBuffer.rangeForRow(rows[0], false);
        // indent and join with \n
        var indentSpaces = this.editor.getTextInBufferRange(firstRowRange).match(/^(\s)*/)[0];
        var indentedContents = contents.map(function (s) { return indentSpaces + s; }).join('\n') + '\n';
        // delete original rows
        if (rows.length === 1) {
            var row = _.head(rows);
            textBuffer.deleteRow(row);
        }
        else {
            var firstRow = _.head(rows);
            var lastRow = _.last(rows);
            textBuffer.deleteRows(firstRow, lastRow);
        }
        // insert case split content
        var position = firstRowRange.start;
        textBuffer.insert(position, indentedContents);
    };
    // rewrite lambda expression
    // not only the goal itself, the clause it belongs to also needs to be rewritten
    Goal.prototype.writeLambda = function (contents) {
        var _this = this;
        // range to scan
        var textBuffer = this.editor.getBuffer();
        var beforeRange = new Range(textBuffer.getFirstPosition(), this.range.start);
        var afterRange = new Range(this.range.end, textBuffer.getEndPosition());
        // scan and build the range to replace text with
        this.editor.backwardsScanInBufferRange(/\;\s*|\{\s*/, beforeRange, function (result) {
            var rewriteRangeStart = result.range.end;
            result.stop();
            _this.editor.scanInBufferRange(/\s*\;|\s*\}/, afterRange, function (result) {
                var rewriteRangeEnd = result.range.start;
                result.stop();
                var rewriteRange = new Range(rewriteRangeStart, rewriteRangeEnd);
                _this.editor.setTextInBufferRange(rewriteRange, contents.join(' ; '));
            });
        });
    };
    Goal.prototype.getContent = function () {
        var range = this.range.translate(new Point(0, 2), new Point(0, -2));
        var rawContent = this.editor.getTextInBufferRange(range);
        return parser_1.parseInputContent(rawContent);
    };
    Goal.prototype.selectContent = function () {
        var indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        var range = this.range.translate(new Point(0, 3), new Point(0, -(3 + indexWidth)));
        this.editor.setSelectedBufferRange(range, {
            reversed: false,
            preserveFolds: true
        });
    };
    Goal.prototype.isEmpty = function () {
        return this.getContent().replace(/(\s|\\n)*/, '').length === 0;
    };
    return Goal;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Goal;
//# sourceMappingURL=goal.js.map