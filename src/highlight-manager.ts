type TextBuffer = any;
type Point = any;
type Range = any;
var { Range } = require("atom");
import { Agda } from "./types";

export default class HighlightManager {
    private core: any;
    private markers: any[];

    constructor(core) {
        this.core = core;
        this.markers = [];
    }

    highlight(annotation: Agda.Annotation) {
        const start = this.core.editor.fromIndex(parseInt(annotation.start) - 1);
        const end = this.core.editor.fromIndex(parseInt(annotation.end) - 1);
        const range = new Range(start, end);
        const marker = this.core.editor.markBufferRange(range);
        this.markers.push(marker);
        const decorator = this.core.editor.decorateMarker(marker, {
            type: "highlight",
            class: `agda-highlight ${annotation.type}`
        });
    }

    destroyAll() {
        this.markers.forEach((marker) => { marker.destroy(); });
        this.markers = [];
    }
}
