"use strict";
var { Range, CompositeDisposable } = require('atom');
const parser_1 = require("./parser");
// # Components
const commander_1 = require("./commander");
const process_1 = require("./process");
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
        this.process = new process_1.default(this);
        this.textBuffer = new text_buffer_1.default(this);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod = new input_method_1.default(this);
        this.highlightManager = new highlight_manager_1.default(this);
        this.commander = new commander_1.default(this);
        // dispatch config related data to the store on initialization
        this.view.store.dispatch(Action.updateMaxBodyHeight(atom.config.get('agda-mode.maxBodyHeight')));
    }
    // shorthand for getting the path of the binded file
    getPath() {
        return parser_1.parseFilepath(this.editor.getPath());
    }
    // Editor Events
    activate() {
        this.view.activate();
    }
    deactivate() {
        this.view.deactivate();
    }
    destroy() {
        this.commander.quit();
        this.view.destroy();
        this.disposables.dispose();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Core;
//# sourceMappingURL=core.js.map