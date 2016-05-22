import { Range, Point } from "atom";
import * as _ from "lodash";
import { parseInputContent } from "./parser";

export default class Goal {
    public  range: TextBuffer.IRange;
    private marker: AtomCore.IDisplayBufferMarker;
    private content: string;

    constructor(
        private editor: AtomCore.IEditor,
        public index: number = -1,         // -1 as Nothing, fuck TypeScript
        startIndex: number,
        endIndex: number
    ) {
        // initialization
        const textBuffer = this.editor.getBuffer();
        const startPoint = textBuffer.positionForCharacterIndex(startIndex);
        const endPoint   = textBuffer.positionForCharacterIndex(  endIndex);
        this.range = new Range(startPoint, endPoint);
        this.content = textBuffer.getTextInRange(this.range);
        this.marker = this.editor.markBufferRange(this.range);

        // overlay element
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const element = document.createElement("div");
        element.innerHTML = this.index.toString();
        element.classList.add("agda-goal-index");
        element.style.left = `${- this.editor.getDefaultCharWidth() * (indexWidth + 2)}px`;
        element.style.top = `${- this.editor.getLineHeightInPixels()}px`;

        // decoration
        const holeDecoration = this.editor.decorateMarker(this.marker, {
            type: "highlight",
            class: "agda-goal"
        });
        const indexDecoration = this.editor.decorateMarker(this.marker, {
            type: "overlay",
            item: element
        });

        // events
        this.marker.onDidChange((event) => {
            const newRange = this.marker.getBufferRange();

            // boundary positions
            const text  = this.editor.getTextInRange(newRange);
            const left  = text.indexOf("{!");
            const right = text.lastIndexOf("!}");

            // special case: "{!}"
            if (left === 0 && right === 1)
                this.restoreBoundary();

            // the entire goal got destroyed, so be it
            else if (left === -1 && right === -1)
                this.destroy();

            // partially damaged
            else if (left === -1 || right === -1)
                this.restoreBoundary();

            else if (left !== -1 && right !== -1) {
                // update states
                const newStart = this.range.start.translate(new Point(0, left));
                const newEnd   = this.range.start.translate(new Point(0, right + 2));
                this.range = new Range(newStart, newEnd)
                this.content = this.editor.getTextInRange(this.range);
                this.marker.setBufferRange(this.range, {});

            } else {
                throw "Goal: WTF!!???"
            }
        });
    }

    destroy() {
        this.marker.destroy();
    }

    restoreBoundary() {
        this.editor.setTextInBufferRange(this.range, this.content);
    }

    removeBoundary() {
        const range = this.range.translate(
                new Point(0, 2),
                new Point(0, -2)
        );
        const rawContent = this.editor.getTextInBufferRange(range);
        this.editor.setTextInBufferRange(this.range, rawContent.trim());
    }

    // replace and insert one or more lines of content at the goal
    // usage: splitting case
    writeLines(contents: string[]) {
        const textBuffer = this.editor.getBuffer();
        const rows = this.range.getRows();
        const firstRowRange = textBuffer.rangeForRow(rows[0]);

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
                this.editor.setTextInBufferRange(rewriteRange, contents.join(" ; "));
            });
        });
    }


    getContent(): string {
        const range = this.range.translate(
            new Point(0, 2),
            new Point(0, -2)
        );
        const rawContent = this.editor.getTextInBufferRange(range);
        return parseInputContent(rawContent);
    }

    setContent(text: string) {
        const range = this.range.translate(
            new Point(0, 2),
            new Point(0, -2)
        );
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const paddingSpaces = _.repeat(" ", indexWidth);
        this.editor.setTextInBufferRange(range, ` ${text} ${paddingSpaces}`);
    }

    selectContent() {
        const indexWidth = this.index === -1 ? 1 : this.index.toString().length;
        const range = this.range.translate(
            new Point(0, 3),
            new Point(0, -(3 + indexWidth))
        );
        this.editor.setSelectedBufferRange(range, {});
    }

    isEmpty(): boolean {
        return this.getContent().replace(/(\s|\\n)*/, "").length === 0;
    }

}
