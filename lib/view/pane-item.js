"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const path = require("path");
const events_1 = require("events");
var { CompositeDisposable } = require('atom');
// Events
exports.OPEN = 'OPEN';
exports.CLOSE = 'CLOSE';
class PaneItem {
    constructor(editor, name, getTitle) {
        this.editor = editor;
        this.name = name;
        this.opener = (uri) => {
            // e.g. "agda-mode://12312/view"
            //       [scheme ]   [dir] [name]
            const openedByAgdaMode = _.startsWith(uri, 'agda-mode://');
            if (openedByAgdaMode) {
                const { dir, name } = path.parse(uri.substr(12));
                const openedByTheSameEditor = dir === this.editor.id.toString();
                const openedForTheSamePurpose = name === this.name;
                if (openedByTheSameEditor && openedForTheSamePurpose)
                    return this.createPaneItem();
                else
                    return null;
            }
            else {
                return null;
            }
        };
        // methods
        this.getTitle = () => {
            const { name } = path.parse(this.editor.getPath());
            return `[Agda Mode] ${name}`;
        };
        this.getURI = () => {
            return `agda-mode://${this.editor.id}/${this.name}`;
        };
        this.subscriptions = new CompositeDisposable;
        this.emitter = new events_1.EventEmitter;
        this.closedDeliberately = false;
        this.subscriptions.add(atom.workspace.addOpener(this.opener));
        if (getTitle)
            this.getTitle = getTitle;
    }
    destroy() {
        this.subscriptions.dispose();
    }
    createPaneItem() {
        // classList
        const paneItem = document.createElement('article');
        paneItem.classList.add('agda-mode');
        // methods
        paneItem['getURI'] = this.getURI;
        paneItem['getTitle'] = this.getTitle;
        paneItem['getEditor'] = () => this.editor;
        return paneItem;
    }
    open(options = {
            searchAllPanes: true,
            split: 'right'
        }) {
        const uri = this.getURI();
        const previousActivePane = atom.workspace.getActivePane();
        atom.workspace.open(uri, options).then(paneItem => {
            this.paneItem = paneItem;
            const currentPane = atom.workspace.paneForItem(paneItem);
            // on open
            this.emitter.emit(exports.OPEN, paneItem, {
                previous: previousActivePane,
                current: currentPane
            });
            // on destroy
            if (currentPane) {
                this.subscriptions.add(currentPane.onWillDestroyItem(event => {
                    if (this.paneItem && event.item.getURI() === this.getURI()) {
                        this.paneItem = null;
                        this.emitter.emit(exports.CLOSE, paneItem, this.closedDeliberately);
                        // reset flags
                        this.closedDeliberately = false;
                    }
                }));
            }
        });
    }
    // idempotent, invoking PaneItem::close the second time won't have any effects
    close() {
        if (this.paneItem) {
            this.closedDeliberately = true;
            const pane = atom.workspace.paneForItem(this.paneItem);
            if (pane)
                pane.destroyItem(this.paneItem);
            this.paneItem = null;
        }
    }
    activate() {
        if (this.paneItem) {
            const pane = atom.workspace.paneForItem(this.paneItem);
            if (pane)
                pane.activateItem(this.paneItem);
        }
    }
    isActive() {
        if (this.paneItem) {
            const pane = atom.workspace.paneForItem(this.paneItem);
            if (pane && pane.isActive()) {
                return pane.getActiveItem().getURI() === this.getURI();
            }
        }
        return false;
    }
    // events
    onOpen(callback) {
        this.emitter.on(exports.OPEN, callback);
    }
    onClose(callback) {
        this.emitter.on(exports.CLOSE, callback);
    }
}
exports.default = PaneItem;
//# sourceMappingURL=pane-item.js.map