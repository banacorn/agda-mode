import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

// # Components
import Commander from './commander';
import ConnectionManager from './connection';
import Editor from './editor';
import View from './view';
import * as Action from './view/actions';

const AgdaModeRE = require('./Reason/AgdaMode.bs');

export interface AgdaEditor extends Atom.TextEditor {
    core: Core;
}

export class Core {
    private disposables: Atom.CompositeDisposable;
    public editor: Editor;
    public commander: Commander;
    public view: View;
    public connection: ConnectionManager;

    constructor(textEditor: Atom.TextEditor) {
        // initialize all components
        this.disposables        = new CompositeDisposable();
        this.editor             = new Editor(this, textEditor);
        // if (atom.config.get('agda-mode.inputMethod'))
        //     this.inputMethod    = new InputMethod(this);
        this.commander          = new Commander(this);
        this.connection         = new ConnectionManager(this);

        // view
        this.view               = new View(this);

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
