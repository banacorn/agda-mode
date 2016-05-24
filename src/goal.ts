import * as _ from "lodash";
import Atom = atom.Typings;
import { parseInputContent } from "./parser";

function translate(textBuffer: Atom.TextBuffer, p: Atom.Point, n: number): Atom.Point {
    return textBuffer.positionForCharacterIndex(textBuffer.characterIndexForPosition(p) + n)
}

function resizeRange(textBuffer: Atom.TextBuffer, range: Atom.Range, left: number, right: number): Atom.Range {
    const start = translate(textBuffer, range.start, left );
    const end   = translate(textBuffer, range.end  , right);
    return new Atom.Range(start, end);
}

export default class Goal {
    public  range: Atom.Range;
    private marker: Atom.TextEditorMarker;
    private content: string;

    constructor(
        private editor: Atom.TextEditor,
        public index: number = -1,         // -1 as Nothing, fuck TypeScript
        startIndex: number,
        endIndex: number
    ) {
        // initialization
        const textBuffer = this.editor.getBuffer();
        const startPoint = textBuffer.positionForCharacterIndex(startIndex);
        const endPoint   = textBuffer.positionForCharacterIndex(  endIndex);
        this.range = new Atom.Range(startPoint, endPoint);
        this.content = textBuffer.getTextInRange(this.range);
        this.marker = this.editor.markBufferRange(this.range, {});

        // overlay element
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const element = document.createElement("div");
        element.innerHTML = this.index.toString();
        element.classList.add("agda-goal-index");
        // element.style.left = `${- this.editor.getDefaultCharWidth() * (indexWidth + 2)}px`;
        // element.style.top = `${- this.editor.getLineHeightInPixels()}px`;

        // decoration
        const holeDecoration = this.editor.decorateMarker(this.marker, {
            type: "highlight",
            class: "agda-goal"
        });
        const indexDecoration = this.editor.decorateMarker(this.marker, {
            type: "overlay",
            class: "",
            item: element
        });

        // events
        this.marker.onDidChange((event) => {
            const newRange = this.marker.getBufferRange();

            // boundary positions
            const text  = this.editor.getBuffer().getTextInRange(newRange);
            const left  = text.indexOf("{!");
            const right = text.lastIndexOf("!}");

            // special case: "{!}"
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
                const textBuffer = this.editor.getBuffer();
                const contentLength = text.length;
                const stretchRight = right - contentLength + 2;
                this.range = resizeRange(textBuffer, newRange, left, stretchRight);
                this.content = textBuffer.getTextInRange(this.range);
                this.marker.setBufferRange(this.range, {
                    reversed: false
                });
            } else {
                throw "Goal: WTF!!???"
            }
        });
    }

    destroy() {
        this.marker.destroy();
    }

    restoreBoundary(newRange: Atom.Range) {
        this.editor.setTextInBufferRange(newRange, this.content);
    }

    removeBoundary() {
        const textBuffer = this.editor.getBuffer();
        const range = resizeRange(textBuffer, this.range, 2, -2)
        const rawContent = this.editor.getTextInBufferRange(range);
        this.editor.setTextInBufferRange(this.range, rawContent.trim());
    }

    // replace and insert one or more lines of content at the goal
    // usage: splitting case
    writeLines(contents: string[]) {
        const textBuffer = this.editor.getBuffer();
        const rows = this.range.getRows();
        const firstRowRange = textBuffer.rangeForRow(rows[0], false);

        // indent and join with \n
        const indentSpaces = this.editor.getTextInBufferRange(firstRowRange).match(/^(\s)*/)[0];
        const indentedContents = contents.map((s) => { return indentSpaces + s; }).join("\n") + "\n";

        // delete original rows
        if (rows.length === 1) {
            const row = _.head(rows);
            textBuffer.deleteRow(row);
        } else {
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
    writeLambda(contents: string[]) {

        // range to scan
        const textBuffer = this.editor.getBuffer();
        const beforeRange = new Atom.Range(textBuffer.getFirstPosition(), this.range.start);
        const afterRange = new Atom.Range(this.range.end, textBuffer.getEndPosition());

        // scan and build the range to replace text with
        this.editor.backwardsScanInBufferRange(/\;\s*|\{\s*/, beforeRange, (result) => {
            const rewriteRangeStart = result.range.end;
            result.stop();
            this.editor.scanInBufferRange(/\s*\;|\s*\}/, afterRange, (result) => {
                const rewriteRangeEnd = result.range.start;
                result.stop();
                const rewriteRange = new Atom.Range(rewriteRangeStart, rewriteRangeEnd);
                this.editor.setTextInBufferRange(rewriteRange, contents.join(" ; "));
            });
        });
    }


    getContent(): string {
        const range = this.range.translate(
            new Atom.Point(0, 2),
            new Atom.Point(0, -2)
        );
        const rawContent = this.editor.getTextInBufferRange(range);
        return parseInputContent(rawContent);
    }

    setContent(text: string) {
        const range = this.range.translate(
            new Atom.Point(0, 2),
            new Atom.Point(0, -2)
        );
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const paddingSpaces = _.repeat(" ", indexWidth);
        this.editor.setTextInBufferRange(range, ` ${text} ${paddingSpaces}`);
    }

    selectContent() {
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const range = this.range.translate(
            new Atom.Point(0, 3),
            new Atom.Point(0, -(3 + indexWidth))
        );
        this.editor.setSelectedBufferRange(range, {
            reversed: false,
            preserveFolds: true
        });
    }

    isEmpty(): boolean {
        return this.getContent().replace(/(\s|\\n)*/, "").length === 0;
    }

}
