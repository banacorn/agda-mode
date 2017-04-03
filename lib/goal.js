"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const parser_1 = require("./parser");
var { Point, Range } = require('atom');
function translate(textBuffer, p, n) {
    return textBuffer.positionForCharacterIndex(textBuffer.characterIndexForPosition(p) + n);
}
function resizeRange(textBuffer, range, left, right) {
    const start = translate(textBuffer, range.start, left);
    const end = translate(textBuffer, range.end, right);
    return new Range(start, end);
}
class Goal {
    constructor(editor, index = -1, // -1 as Nothing, fuck TypeScript
        startIndex, endIndex) {
        this.editor = editor;
        this.index = index;
        this.setContent = (text) => {
            const range = this.range.translate(new Point(0, 2), new Point(0, -2));
            const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
            const paddingSpaces = _.repeat(' ', indexWidth);
            this.editor.setTextInBufferRange(range, ` ${text} ${paddingSpaces}`);
            return this;
        };
        // initialization
        const textBuffer = this.editor.getBuffer();
        const startPoint = textBuffer.positionForCharacterIndex(startIndex);
        const endPoint = textBuffer.positionForCharacterIndex(endIndex);
        this.range = new Range(startPoint, endPoint);
        this.content = textBuffer.getTextInRange(this.range);
        this.marker = this.editor.markBufferRange(this.range, {});
        // overlay element
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const element = document.createElement('div');
        if (this.index === -1)
            element.innerHTML = '*';
        else
            element.innerHTML = this.index.toString();
        element.classList.add('goal-index');
        // those measurement functions are no longer part of the public API
        // we should come up with a new way to steal those measurements
        element.style.left = `${-indexWidth - 2}ex`;
        element.style.top = `-1.5em`;
        // element.style.left = `${- this.editor.getDefaultCharWidth() * (indexWidth + 2)}px`;
        // element.style.top = `${- this.editor.getLineHeightInPixels()}px`;
        // decoration
        const holeDecoration = this.editor.decorateMarker(this.marker, {
            type: 'highlight',
            class: 'goal'
        });
        const indexDecoration = this.editor.decorateMarker(this.marker, {
            type: 'overlay',
            position: 'head',
            item: element
        });
        // events
        this.marker.onDidChange((event) => {
            const newRange = this.marker.getBufferRange();
            // boundary positions
            const text = this.editor.getBuffer().getTextInRange(newRange);
            const left = text.indexOf('{!');
            const right = text.lastIndexOf('!}');
            // special case: '{!}'
            if (left === 0 && right === 1)
                this.restoreBoundary(newRange);
            else if (left === -1 && right === -1)
                this.destroy();
            else if (left === -1 || right === -1) {
                this.restoreBoundary(newRange);
            }
            else if (left !== -1 && right !== -1) {
                const textBuffer = this.editor.getBuffer();
                const contentLength = text.length;
                const stretchRight = right - contentLength + 2;
                this.range = resizeRange(textBuffer, newRange, left, stretchRight);
                this.content = textBuffer.getTextInRange(this.range);
                this.marker.setBufferRange(this.range, {
                    reversed: false
                });
            }
            else {
                throw 'Goal: WTF!!???';
            }
        });
    }
    destroy() {
        this.marker.destroy();
    }
    restoreBoundary(newRange) {
        this.editor.setTextInBufferRange(newRange, this.content);
    }
    removeBoundary() {
        const textBuffer = this.editor.getBuffer();
        const range = resizeRange(textBuffer, this.range, 2, -2);
        const rawContent = this.editor.getTextInBufferRange(range);
        this.editor.setTextInBufferRange(this.range, rawContent.trim());
    }
    // replace and insert one or more lines of content at the goal
    // usage: splitting case
    writeLines(contents) {
        const textBuffer = this.editor.getBuffer();
        const rows = this.range.getRows();
        const firstRowRange = textBuffer.rangeForRow(rows[0], false);
        // indent and join with \n
        const indentSpaces = this.editor.getTextInBufferRange(firstRowRange).match(/^(\s)*/)[0];
        const indentedContents = contents.map((s) => { return indentSpaces + s; }).join('\n') + '\n';
        // delete original rows
        if (rows.length === 1) {
            const row = _.head(rows);
            textBuffer.deleteRow(row);
        }
        else {
            const firstRow = _.head(rows);
            const lastRow = _.last(rows);
            textBuffer.deleteRows(firstRow, lastRow);
        }
        // insert case split content
        const position = firstRowRange.start;
        textBuffer.insert(position, indentedContents);
    }
    // rewrite lambda expression
    // not only the goal itself, the clause it belongs to also needs to be rewritten
    writeLambda(contents) {
        // range to scan
        const textBuffer = this.editor.getBuffer();
        const beforeRange = new Range(textBuffer.getFirstPosition(), this.range.start);
        const afterRange = new Range(this.range.end, textBuffer.getEndPosition());
        // scan and build the range to replace text with
        this.editor.backwardsScanInBufferRange(/\;\s*|\{\s*/, beforeRange, (result) => {
            const rewriteRangeStart = result.range.end;
            result.stop();
            this.editor.scanInBufferRange(/\s*\;|\s*\}/, afterRange, (result) => {
                const rewriteRangeEnd = result.range.start;
                result.stop();
                const rewriteRange = new Range(rewriteRangeStart, rewriteRangeEnd);
                this.editor.setTextInBufferRange(rewriteRange, contents.join(' ; '));
            });
        });
    }
    getContent() {
        const range = this.range.translate(new Point(0, 2), new Point(0, -2));
        const rawContent = this.editor.getTextInBufferRange(range);
        return parser_1.parseInputContent(rawContent);
    }
    selectContent() {
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const range = this.range.translate(new Point(0, 3), new Point(0, -(3 + indexWidth)));
        this.editor.setSelectedBufferRange(range, {
            reversed: false,
            preserveFolds: true
        });
    }
    isEmpty() {
        return this.getContent().replace(/(\s|\\n)*/, '').length === 0;
    }
}
exports.default = Goal;
//# sourceMappingURL=goal.js.map