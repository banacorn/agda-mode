"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
// # Components
const commander_1 = require("./commander");
const connection_1 = require("./connection");
const editor_1 = require("./editor");
const view_1 = require("./view");
const AgdaModeRE = require('./Reason/AgdaMode.bs');
class Core {
    constructor(textEditor) {
        // initialize all components
        this.disposables = new atom_1.CompositeDisposable();
        this.editor = new editor_1.default(this, textEditor);
        // if (atom.config.get('agda-mode.inputMethod'))
        //     this.inputMethod    = new InputMethod(this);
        this.commander = new commander_1.default(this);
        this.connection = new connection_1.default(this);
        // view
        this.view = new view_1.default(this);
        AgdaModeRE.initialize(textEditor);
        // ViewRE.initialize(textEditor);
        // dispatch config related data to the store on initialization
        // this.view.store.dispatch(Action.updateMaxBodyHeight(atom.config.get('agda-mode.maxBodyHeight')));
        // // catch changes to the setting.
        // atom.config.observe('agda-mode.agdaPath', (newValue) => {
        //     console.log(`observed changes in path: ${newValue}`)
        // })
    }
    // Editor Events
    activate() {
        AgdaModeRE.activate(this.editor.getPath());
        // ViewRE.jsMountPanel("bottom");
        // this.view.activatePanel();
    }
    deactivate() {
        AgdaModeRE.deactivate(this.editor.getPath());
        // ViewRE.jsMountPanel("nowhere");
        // this.view.deactivatePanel();
    }
    destroy() {
        this.commander.dispatch({ kind: "Quit" }).then(() => {
            this.view.destroy();
            this.disposables.dispose();
        });
    }
}
exports.Core = Core;
//# sourceMappingURL=core.js.map