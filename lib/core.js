"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var { Range, CompositeDisposable } = require('atom');
const Promise = require("bluebird");
const parser_1 = require("./parser");
// # Components
const commander_1 = require("./commander");
const connector_1 = require("./connector");
const text_buffer_1 = require("./text-buffer");
const input_method_1 = require("./input-method");
const highlight_manager_1 = require("./highlight-manager");
const view_1 = require("./view");
const Action = require("./view/actions");
class Core {
    constructor(editor) {
        this.editor = editor;
        // helper methods on this.editor
        this.editor.fromIndex = (ind) => {
            return this.editor.getBuffer().positionForCharacterIndex(ind);
        };
        this.editor.toIndex = (pos) => {
            return this.editor.getBuffer().characterIndexForPosition(pos);
        };
        this.editor.translate = (pos, n) => {
            return this.editor.fromIndex((this.editor.toIndex(pos)) + n);
        };
        this.editor.fromCIRange = (range) => {
            const start = this.editor.fromIndex(range.start);
            const end = this.editor.fromIndex(range.end);
            return new Range(start, end);
        };
        // initialize all components
        this.disposables = new CompositeDisposable();
        // view
        this.view = new view_1.default(this);
        this.textBuffer = new text_buffer_1.default(this);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod = new input_method_1.default(this);
        this.highlightManager = new highlight_manager_1.default(this);
        this.commander = new commander_1.default(this);
        this.connector = new connector_1.default(this);
        // dispatch config related data to the store on initialization
        this.view.store.dispatch(Action.updateMaxBodyHeight(atom.config.get('agda-mode.maxBodyHeight')));
    }
    // issue #48, TextBuffer::save will be async in Atom 1.19
    saveEditor() {
        let promise = this.editor.save();
        if (promise && promise.then) {
            return promise.then((e) => {
                return Promise.resolve();
            });
        }
        else {
            return Promise.resolve();
        }
    }
    // shorthand for getting the path of the binded file
    getPath() {
        return parser_1.parseFilepath(this.editor.getPath());
    }
    // Editor Events
    activate() {
        this.view.activatePanel();
    }
    deactivate() {
        this.view.deactivatePanel();
    }
    destroy() {
        this.commander.dispatch({ kind: "Quit" }).then(() => {
            this.view.destroy();
            this.disposables.dispose();
        });
    }
}
exports.default = Core;
//# sourceMappingURL=core.js.map