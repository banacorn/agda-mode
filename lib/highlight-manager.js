"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var { Range } = require('atom');
class HighlightManager {
    constructor(core) {
        this.core = core;
        this.markers = [];
    }
    highlight(annotation) {
        const start = this.core.editor.fromIndex(parseInt(annotation.start) - 1);
        const end = this.core.editor.fromIndex(parseInt(annotation.end) - 1);
        const range = new Range(start, end);
        const marker = this.core.editor.markBufferRange(range);
        this.markers.push(marker);
        const decorator = this.core.editor.decorateMarker(marker, {
            type: 'highlight',
            class: `highlight-decoration ${annotation.type}`
        });
    }
    destroyAll() {
        this.markers.forEach((marker) => { marker.destroy(); });
        this.markers = [];
    }
}
exports.default = HighlightManager;
//# sourceMappingURL=highlight-manager.js.map