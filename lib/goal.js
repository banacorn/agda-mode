"use strict";
var atom_1 = require("atom");
var _ = require("lodash");
var parser_1 = require("./parser");
var Goal = (function () {
    function Goal(editor, index, startIndex, endIndex) {
        var _this = this;
        if (index === void 0) { index = -1; }
        this.editor = editor;
        this.index = index;
        var textBuffer = this.editor.getBuffer();
        var startPoint = textBuffer.positionForCharacterIndex(startIndex);
        var endPoint = textBuffer.positionForCharacterIndex(endIndex);
        this.range = new atom_1.Range(startPoint, endPoint);
        this.content = textBuffer.getTextInRange(this.range);
        this.marker = this.editor.markBufferRange(this.range);
        var indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        var element = document.createElement("div");
        element.innerHTML = this.index.toString();
        element.classList.add("agda-goal-index");
        element.style.left = -this.editor.getDefaultCharWidth() * (indexWidth + 2) + "px";
        element.style.top = -this.editor.getLineHeightInPixels() + "px";
        var holeDecoration = this.editor.decorateMarker(this.marker, {
            type: "highlight",
            class: "agda-goal"
        });
        var indexDecoration = this.editor.decorateMarker(this.marker, {
            type: "overlay",
            item: element
        });
        this.marker.onDidChange(function (event) {
            var newRange = _this.marker.getBufferRange();
            var text = _this.editor.getTextInRange(newRange);
            var left = text.indexOf("{!");
            var right = text.lastIndexOf("!}");
            if (left === 0 && right === 1)
                _this.restoreBoundary();
            else if (left === -1 && right === -1)
                _this.destroy();
            else if (left === -1 || right === -1)
                _this.restoreBoundary();
            else if (left !== -1 && right !== -1) {
                var newStart = _this.range.start.translate(new atom_1.Point(0, left));
                var newEnd = _this.range.start.translate(new atom_1.Point(0, right + 2));
                _this.range = new atom_1.Range(newStart, newEnd);
                _this.content = _this.editor.getTextInRange(_this.range);
                _this.marker.setBufferRange(_this.range, {});
            }
            else {
                throw "Goal: WTF!!???";
            }
        });
    }
    Goal.prototype.destroy = function () {
        this.marker.destroy();
    };
    Goal.prototype.restoreBoundary = function () {
        this.editor.setTextInBufferRange(this.range, this.content);
    };
    Goal.prototype.removeBoundary = function () {
        var range = this.range.translate(new atom_1.Point(0, 2), new atom_1.Point(0, -2));
        var rawContent = this.editor.getTextInBufferRange(range);
        this.editor.setTextInBufferRange(this.range, rawContent.trim());
    };
    Goal.prototype.writeLines = function (contents) {
        var textBuffer = this.editor.getBuffer();
        var rows = this.range.getRows();
        var firstRowRange = textBuffer.rangeForRow(rows[0]);
        var indentSpaces = this.editor.getTextInBufferRange(firstRowRange).match(/^(\s)*/)[0];
        var indentedContents = contents.map(function (s) { return indentSpaces + s; }).join("\n") + "\n";
        if (rows.length === 1) {
            var row = _.head(rows);
            textBuffer.deleteRow(row);
        }
        else {
            var firstRow = _.head(rows);
            var lastRow = _.last(rows);
            textBuffer.deleteRows(firstRow, lastRow);
        }
        var position = firstRowRange.start;
        textBuffer.insert(position, indentedContents);
    };
    Goal.prototype.writeLambda = function (contents) {
        var _this = this;
        var textBuffer = this.editor.getBuffer();
        var beforeRange = new atom_1.Range(textBuffer.getFirstPosition(), this.range.start);
        var afterRange = new atom_1.Range(this.range.end, textBuffer.getEndPosition());
        this.editor.backwardsScanInBufferRange(/\;\s*|\{\s*/, beforeRange, function (result) {
            var rewriteRangeStart = result.range.end;
            result.stop();
            _this.editor.scanInBufferRange(/\s*\;|\s*\}/, afterRange, function (result) {
                var rewriteRangeEnd = result.range.start;
                result.stop();
                var rewriteRange = new atom_1.Range(rewriteRangeStart, rewriteRangeEnd);
                _this.editor.setTextInBufferRange(rewriteRange, contents.join(" ; "));
            });
        });
    };
    Goal.prototype.getContent = function () {
        var range = this.range.translate(new atom_1.Point(0, 2), new atom_1.Point(0, -2));
        var rawContent = this.editor.getTextInBufferRange(range);
        return parser_1.inputContent(rawContent);
    };
    Goal.prototype.setContent = function (text) {
        var range = this.range.translate(new atom_1.Point(0, 2), new atom_1.Point(0, -2));
        var indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        var paddingSpaces = _.repeat(" ", indexWidth);
        this.editor.setTextInBufferRange(range, " " + text + " " + paddingSpaces);
    };
    Goal.prototype.selectContent = function () {
        var indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        var range = this.range.translate(new atom_1.Point(0, 3), new atom_1.Point(0, -(3 + indexWidth)));
        this.editor.setSelectedBufferRange(range, {});
    };
    Goal.prototype.isEmpty = function () {
        return this.getContent().replace(/(\s|\\n)*/, "").length === 0;
    };
    return Goal;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Goal;
