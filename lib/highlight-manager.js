"use strict";
var Range = require("atom").Range;
var HighlightManager = (function () {
    function HighlightManager(core) {
        this.core = core;
        this.markers = [];
    }
    HighlightManager.prototype.highlight = function (annotation) {
        var start = this.core.editor.fromIndex(parseInt(annotation.start) - 1);
        var end = this.core.editor.fromIndex(parseInt(annotation.end) - 1);
        var range = new Range(start, end);
        var marker = this.core.editor.markBufferRange(range);
        this.markers.push(marker);
        var decorator = this.core.editor.decorateMarker(marker, {
            type: "highlight",
            class: "agda-highlight " + annotation.type
        });
    };
    HighlightManager.prototype.destroyAll = function () {
        this.markers.forEach(function (marker) { marker.destroy(); });
        this.markers = [];
    };
    return HighlightManager;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HighlightManager;
