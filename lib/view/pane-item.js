"use strict";
var path = require('path');
var events_1 = require('events');
var CompositeDisposable = require('atom').CompositeDisposable;
// Events
exports.OPEN = 'OPEN';
exports.CLOSE = 'CLOSE';
var PaneItem = (function () {
    function PaneItem(editor, name) {
        var _this = this;
        this.editor = editor;
        this.name = name;
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
        // methods
        this.getURI = function () {
            return "agda-mode://" + _this.editor.id + "/" + _this.name;
        };
        this.subscriptions = new CompositeDisposable;
        this.emitter = new events_1.EventEmitter;
        this.closedDeliberately = false;
        this.subscriptions.add(atom.workspace.addOpener(this.opener));
    }
    PaneItem.prototype.destroy = function () {
        this.subscriptions.dispose();
    };
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
    // a predicate that decides if a pane item belongs to itself
    PaneItem.prototype.isOwnedPaneItem = function (paneItem) {
        return paneItem.getEditor().id === this.editor.id;
    };
    PaneItem.prototype.open = function () {
        var _this = this;
        var uri = this.getURI();
        var previousActivePane = atom.workspace.getActivePane();
        atom.workspace.open(uri, {
            searchAllPanes: true,
            split: 'right'
        }).then(function (paneItem) {
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
                    if (_this.isOwnedPaneItem(event.item)) {
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
            var currentPane = atom.workspace.paneForItem(this.paneItem);
            currentPane.destroyItem(this.paneItem);
            this.paneItem = null;
        }
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