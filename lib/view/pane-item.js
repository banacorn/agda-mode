"use strict";
var path = require('path');
var PaneItem = (function () {
    function PaneItem(editor, name) {
        var _this = this;
        this.editor = editor;
        this.name = name;
        this.opener = function (uri) {
            var _a = uri.split('://'), protocol = _a[0], editorID = _a[1];
            var openedByAgdaMode = protocol === 'agda-mode';
            var openedByTheSameEditor = editorID === _this.editor.id.toString();
            if (openedByAgdaMode && openedByTheSameEditor) {
                return _this.createPaneItem();
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
        paneItem['getURI'] = function () { return ("agda-mode://" + _this.editor.id); };
        paneItem['getTitle'] = function () { return title; };
        paneItem['getEditor'] = function () { return _this.editor; };
        paneItem.id = "agda-mode://" + this.editor.id;
        return paneItem;
    };
    return PaneItem;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaneItem;
//# sourceMappingURL=pane-item.js.map