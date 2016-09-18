"use strict";
var path = require('path');
var PaneItem = (function () {
    function PaneItem(editor, name) {
        var _this = this;
        this.editor = editor;
        this.name = name;
        this.getURI = function () {
            return "agda-mode://" + _this.editor.id + "/" + _this.name;
        };
        this.opener = function (uri) {
            // e.g. "agda-mode://12312/view"
            //       [scheme ]   [dir] [name]
            var _a = uri.split('://'), scheme = _a[0], pathRest = _a[1];
            var _b = path.parse(pathRest), dir = _b.dir, name = _b.name;
            var openedByAgdaMode = scheme === 'agda-mode';
            var openedByTheSameEditor = dir === _this.editor.id.toString();
            var openedForTheSamePurpose = name === _this.name;
            if (openedByAgdaMode && openedByTheSameEditor && openedForTheSamePurpose) {
                return _this.createPaneItem();
            }
            else {
                return null;
            }
        };
    }
    PaneItem.prototype.createPaneItem = function () {
        var _this = this;
        // classList
        var paneItem = document.createElement('article');
        paneItem.classList.add('agda-view');
        // title
        var base = path.basename(this.editor.getPath());
        var ext = path.extname(base);
        var title = "[Agda Mode] " + base.substr(0, base.length - ext.length);
        // methods
        paneItem['getURI'] = this.getURI;
        paneItem['getTitle'] = function () { return title; };
        paneItem['getEditor'] = function () { return _this.editor; };
        paneItem.id = this.editor.id;
        return paneItem;
    };
    return PaneItem;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaneItem;
//# sourceMappingURL=pane-item.js.map