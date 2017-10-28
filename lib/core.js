"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
// # Components
const commander_1 = require("./commander");
const connection_1 = require("./connection");
const editor_1 = require("./editor");
const input_method_1 = require("./input-method");
const view_1 = require("./view");
const Action = require("./view/actions");
class Core {
    constructor(textEditor) {
        // initialize all components
        this.disposables = new atom_1.CompositeDisposable();
        this.editor = new editor_1.default(this, textEditor);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod = new input_method_1.default(this);
        this.commander = new commander_1.default(this);
        this.connection = new connection_1.default(this);
        // view
        this.view = new view_1.default(this);
        // dispatch config related data to the store on initialization
        this.view.store.dispatch(Action.updateMaxBodyHeight(atom.config.get('agda-mode.maxBodyHeight')));
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