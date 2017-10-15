import * as _ from 'lodash';
type CompositeDisposable = any;
type TextEditor = any;
declare var atom: any;
var { CompositeDisposable } = require('atom');
import * as Redux from 'redux';
import * as Promise from 'bluebird';

import { View as ViewType } from './type';

// # Components
import Commander from './commander';
import ConnectionManager from './connection';
import Editor from './editor';
import InputMethod from './input-method';
import View from './view';
import * as Action from './view/actions';

export default class Core {
    private disposables: CompositeDisposable;
    public editor: Editor;
    public inputMethod: InputMethod;
    public commander: Commander;
    public view: View;
    public connection: ConnectionManager;

    constructor(textEditor: TextEditor) {

        // initialize all components
        this.disposables        = new CompositeDisposable();
        this.editor             = new Editor(this, textEditor);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod    = new InputMethod(this);
        this.commander          = new Commander(this);
        this.connection         = new ConnectionManager(this);

        // view
        this.view               = new View(this);

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
