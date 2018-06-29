"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const parser_1 = require("./../parser");
// type TextBuffer = any;
// type Point = any;
// type Range = any;
// type TextEditorMarker = any;
// type TextEditor = any;
const atom_1 = require("atom");
function translate(textBuffer, p, n) {
    return textBuffer.positionForCharacterIndex(textBuffer.characterIndexForPosition(p) + n);
}
function resizeRange(textBuffer, range, left, right) {
    const start = translate(textBuffer, [range.start.row, range.start.column], left);
    const end = translate(textBuffer, [range.end.row, range.end.column], right);
    return new atom_1.Range(start, end);
}
class Goal {
    constructor(textEditor, index = -1, // -1 as Nothing, fuck TypeScript
    rangeIndex) {
        this.textEditor = textEditor;
        this.index = index;
        this.rangeIndex = rangeIndex;
        this.setContent = (text) => {
            const range = this.range.translate(new atom_1.Point(0, 2), new atom_1.Point(0, -2));
            const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
            const paddingSpaces = _.repeat(' ', indexWidth);
            this.textEditor.setTextInBufferRange(range, ` ${text} ${paddingSpaces}`);
            return this;
        };
        // initialization
        const textBuffer = this.textEditor.getBuffer();
        const startPoint = textBuffer.positionForCharacterIndex(rangeIndex.start);
        const endPoint = textBuffer.positionForCharacterIndex(rangeIndex.end);
        this.range = new atom_1.Range(startPoint, endPoint);
        this.content = textBuffer.getTextInRange(this.range);
        this.marker = this.textEditor.markBufferRange(this.range, {});
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
        // element.style.left = `${- this.textEditor.getDefaultCharWidth() * (indexWidth + 2)}px`;
        // element.style.top = `${- this.textEditor.getLineHeightInPixels()}px`;
        // decoration
        const holeDecoration = this.textEditor.decorateMarker(this.marker, {
            type: 'highlight',
            class: 'goal'
        });
        const indexDecoration = this.textEditor.decorateMarker(this.marker, {
            type: 'overlay',
            position: 'head',
            item: element
        });
        // events
        this.marker.onDidChange((event) => {
            const newRange = this.marker.getBufferRange();
            // boundary positions
            const text = this.textEditor.getBuffer().getTextInRange(newRange);
            const left = text.indexOf('{!');
            const right = text.lastIndexOf('!}');
            // special case: '{!}'
            if (left === 0 && right === 1)
                this.restoreBoundary(newRange);
            // the entire goal got destroyed, so be it
            else if (left === -1 && right === -1)
                this.destroy();
            // partially damaged
            else if (left === -1 || right === -1) {
                this.restoreBoundary(newRange);
            }
            else if (left !== -1 && right !== -1) {
                const textBuffer = this.textEditor.getBuffer();
                const contentLength = text.length;
                const stretchRight = right - contentLength + 2;
                this.range = resizeRange(textBuffer, newRange, left, stretchRight);
                this.rangeIndex = {
                    start: textBuffer.characterIndexForPosition(atom_1.Point.fromObject(this.range.start)),
                    end: textBuffer.characterIndexForPosition(atom_1.Point.fromObject(this.range.end)),
                };
                // }resizeRange(textBuffer, newRange, left, stretchRight);
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
        this.textEditor.setTextInBufferRange(newRange, this.content);
    }
    removeBoundary() {
        const textBuffer = this.textEditor.getBuffer();
        const range = resizeRange(textBuffer, this.range, 2, -2);
        const rawContent = this.textEditor.getTextInBufferRange(range);
        this.textEditor.setTextInBufferRange(this.range, rawContent.trim());
    }
    // replace and insert one or more lines of content at the goal
    // usage: splitting case
    writeLines(contents) {
        const textBuffer = this.textEditor.getBuffer();
        const rows = this.range.getRows();
        const firstRowRange = textBuffer.rangeForRow(rows[0], false);
        // indent and join with \n
        const indentSpaces = this.textEditor.getTextInBufferRange(firstRowRange).match(/^(\s)*/)[0];
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
        const textBuffer = this.textEditor.getBuffer();
        const beforeRange = new atom_1.Range(textBuffer.getFirstPosition(), this.range.start);
        const afterRange = new atom_1.Range(this.range.end, textBuffer.getEndPosition());
        // scan and build the range to replace text with
        this.textEditor.backwardsScanInBufferRange(/\;\s*|\{\s*/, beforeRange, (result) => {
            const rewriteRangeStart = result.range.end;
            result.stop();
            this.textEditor.scanInBufferRange(/\s*\;|\s*\}/, afterRange, (result) => {
                const rewriteRangeEnd = result.range.start;
                result.stop();
                const rewriteRange = new atom_1.Range(rewriteRangeStart, rewriteRangeEnd);
                this.textEditor.setTextInBufferRange(rewriteRange, contents.join(' ; '));
            });
        });
    }
    getContent() {
        const range = this.range.translate(new atom_1.Point(0, 2), new atom_1.Point(0, -2));
        const rawContent = this.textEditor.getTextInBufferRange(range);
        return parser_1.parseInputContent(rawContent);
    }
    selectContent() {
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const range = this.range.translate(new atom_1.Point(0, 3), new atom_1.Point(0, -(3 + indexWidth)));
        this.textEditor.setSelectedBufferRange(range, {
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