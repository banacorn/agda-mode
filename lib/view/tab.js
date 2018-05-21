"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const events_1 = require("events");
const atom_1 = require("atom");
// Events
exports.OPEN = 'OPEN';
exports.CLOSE = 'CLOSE'; // deliberately closing the tab
exports.KILL = 'KILL'; //  unintentionally destroying tab
;
class Tab {
    constructor(editor, name, getTitle) {
        this.editor = editor;
        this.name = name;
        // methods
        this.getTitle = () => {
            const { name } = path.parse(this.editor.getPath());
            return `[Agda Mode] ${name}`;
        };
        this.getURI = () => {
            return `agda-mode://${this.editor.id}/${this.name}`;
        };
        this.getElement = () => {
            if (this.item)
                return this.item.element;
        };
        this.getPane = () => {
            return atom.workspace.paneForItem(this.item);
        };
        this.subscriptions = new atom_1.CompositeDisposable;
        this.emitter = new events_1.EventEmitter;
        this.closedDeliberately = false;
        // this.subscriptions.add(atom.workspace.addOpener(this.opener));
        if (getTitle)
            this.getTitle = getTitle;
    }
    destroy() {
        this.subscriptions.dispose();
    }
    createPaneItem() {
        const element = document.createElement('article');
        element.classList.add('agda-mode');
        return {
            element,
            getURI: this.getURI,
            getTitle: this.getTitle,
            getDefaultLocation: () => 'right'
        };
    }
    // open a new tab!
    open() {
        let options = {
            searchAllPanes: true,
            split: 'right'
        };
        const uri = this.getURI();
        const previousActivePane = atom.workspace.getActivePane();
        const item = this.createPaneItem();
        // TODO: type this
        return atom.workspace['open' + ''](item).then(item => {
            this.item = item;
            const pane = this.getPane();
            // on open
            this.emitter.emit(exports.OPEN, this, {
                previous: previousActivePane,
                current: pane
            });
            // on destroy
            if (pane) {
                this.subscriptions.add(pane.onWillDestroyItem(event => {
                    if (this.item && event.item.getURI() === uri) {
                        this.item = null;
                        if (this.closedDeliberately) {
                            this.emitter.emit(exports.CLOSE, this);
                        }
                        else {
                            this.emitter.emit(exports.KILL, this);
                        }
                        // reset flags
                        this.closedDeliberately = false;
                    }
                }));
            }
            // pass it down the promise
            return this;
        });
    }
    // idempotent, invoking close() the second time won't have any effects
    close() {
        if (this.item) {
            this.closedDeliberately = true;
            const pane = this.getPane();
            if (pane)
                pane.destroyItem(this.item);
            this.item = null;
        }
    }
    activate() {
        if (this.item) {
            const pane = this.getPane();
            if (pane) {
                pane.activateItem(this.item);
            }
        }
    }
    isActive() {
        if (this.item) {
            const pane = this.getPane();
            if (pane && pane.isActive()) {
                return pane.getActiveItem().getURI() === this.getURI();
            }
        }
        return false;
    }
    ////////////////////////////////////
    //  Events
    ////////////////////////////////////
    onOpen(callback) {
        this.emitter.on(exports.OPEN, callback);
    }
    onClose(callback) {
        this.emitter.on(exports.CLOSE, callback);
    }
    onKill(callback) {
        this.emitter.on(exports.KILL, callback);
    }
}
exports.default = Tab;
//# sourceMappingURL=tab.js.map