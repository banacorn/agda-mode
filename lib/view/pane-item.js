"use strict";
var _ = require("lodash");
var path = require("path");
var events_1 = require("events");
var CompositeDisposable = require('atom').CompositeDisposable;
// Events
exports.OPEN = 'OPEN';
exports.CLOSE = 'CLOSE';
var PaneItem = (function () {
    function PaneItem(editor, name, getTitle) {
        var _this = this;
        this.editor = editor;
        this.name = name;
        this.opener = function (uri) {
            // e.g. "agda-mode://12312/view"
            //       [scheme ]   [dir] [name]
            var openedByAgdaMode = _.startsWith(uri, 'agda-mode://');
            if (openedByAgdaMode) {
                var _a = path.parse(uri.substr(12)), dir = _a.dir, name_1 = _a.name;
                var openedByTheSameEditor = dir === _this.editor.id.toString();
                var openedForTheSamePurpose = name_1 === _this.name;
                if (openedByTheSameEditor && openedForTheSamePurpose)
                    return _this.createPaneItem();
                else
                    return null;
            }
            else {
                return null;
            }
        };
        // methods
        this.getTitle = function () {
            var name = path.parse(_this.editor.getPath()).name;
            return "[Agda Mode] " + name;
        };
        this.getURI = function () {
            return "agda-mode://" + _this.editor.id + "/" + _this.name;
        };
        this.subscriptions = new CompositeDisposable;
        this.emitter = new events_1.EventEmitter;
        this.closedDeliberately = false;
        this.subscriptions.add(atom.workspace.addOpener(this.opener));
        if (getTitle)
            this.getTitle = getTitle;
    }
    PaneItem.prototype.destroy = function () {
        this.subscriptions.dispose();
    };
    PaneItem.prototype.createPaneItem = function () {
        var _this = this;
        // classList
        var paneItem = document.createElement('article');
        paneItem.classList.add('agda-view');
        // methods
        paneItem['getURI'] = this.getURI;
        paneItem['getTitle'] = this.getTitle;
        paneItem['getEditor'] = function () { return _this.editor; };
        return paneItem;
    };
    PaneItem.prototype.open = function (options) {
        var _this = this;
        if (options === void 0) { options = {
            searchAllPanes: true,
            split: 'right'
        }; }
        var uri = this.getURI();
        var previousActivePane = atom.workspace.getActivePane();
        atom.workspace.open(uri, options).then(function (paneItem) {
            _this.paneItem = paneItem;
            var currentPane = atom.workspace.paneForItem(paneItem);
            // on open
            _this.emitter.emit(exports.OPEN, paneItem, {
                previous: previousActivePane,
                current: currentPane
            });
            // on destroy
            if (currentPane) {
                _this.subscriptions.add(currentPane.onWillDestroyItem(function (event) {
                    if (_this.paneItem && event.item.getURI() === _this.getURI()) {
                        _this.paneItem = null;
                        _this.emitter.emit(exports.CLOSE, paneItem, _this.closedDeliberately);
                        // reset flags
                        _this.closedDeliberately = false;
                    }
                }));
            }
        });
    };
    // idempotent, invoking PaneItem::close the second time won't have any effects
    PaneItem.prototype.close = function () {
        if (this.paneItem) {
            this.closedDeliberately = true;
            var pane = atom.workspace.paneForItem(this.paneItem);
            if (pane)
                pane.destroyItem(this.paneItem);
            this.paneItem = null;
        }
    };
    PaneItem.prototype.activate = function () {
        if (this.paneItem) {
            var pane = atom.workspace.paneForItem(this.paneItem);
            if (pane)
                pane.activateItem(this.paneItem);
        }
    };
    PaneItem.prototype.isActive = function () {
        if (this.paneItem) {
            var pane = atom.workspace.paneForItem(this.paneItem);
            if (pane && pane.isActive()) {
                return pane.getActiveItem().getURI() === this.getURI();
            }
        }
        return false;
    };
    // events
    PaneItem.prototype.onOpen = function (callback) {
        this.emitter.on(exports.OPEN, callback);
    };
    PaneItem.prototype.onClose = function (callback) {
        this.emitter.on(exports.CLOSE, callback);
    };
    return PaneItem;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PaneItem;
//# sourceMappingURL=pane-item.js.map