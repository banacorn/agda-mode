import * as _ from 'lodash';
type CompositeDisposable = any;
type Range = any;
type Editor = any;
declare var atom: any;
var { Range, CompositeDisposable } = require('atom');

import { parseFilepath } from './parser';
import * as Redux from 'redux';
import { View as ViewType } from './type';

// # Components
import Commander from './commander';
import Connector from './connector';
import TextBuffer from './text-buffer';
import InputMethod from './input-method';
import HighlightManager from './highlight-manager';
import LSP from './lsp';
import View from './view';
import * as Action from './view/actions';
import * as Store from './persist';

export default class Core {
    private disposables: CompositeDisposable;
    public textBuffer: TextBuffer;
    public inputMethod: InputMethod;
    public highlightManager: HighlightManager;
    public lsp: LSP;
    public commander: Commander;
    public view: View;
    public connector: Connector;

    constructor(public editor: Editor) {


        // helper methods on this.editor
        this.editor.fromIndex = (ind: number): number => {
            return this.editor.getBuffer().positionForCharacterIndex(ind);
        }
        this.editor.toIndex = (pos: number): number => {
            return this.editor.getBuffer().characterIndexForPosition(pos);
        }
        this.editor.translate = (pos: number, n: number): number => {
            return this.editor.fromIndex((this.editor.toIndex(pos)) + n)
        }

        this.editor.fromCIRange = (range: { start: number, end: number }): Range => {
            const start = this.editor.fromIndex(range.start);
            const end   = this.editor.fromIndex(range.end);
            return new Range(start, end);
        }

        // initialize all components
        this.disposables        = new CompositeDisposable();
        // view
        this.view               = new View(this);
        this.textBuffer         = new TextBuffer(this);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod    = new InputMethod(this);
        this.highlightManager   = new HighlightManager(this);
        this.lsp                = new LSP();
        this.commander          = new Commander(this);
        this.connector          = new Connector(this);

        // dispatch config related data to the store on initialization
        this.view.store.dispatch(Action.updateMaxBodyHeight(atom.config.get('agda-mode.maxBodyHeight')));
    }

    // shorthand for getting the path of the binded file
    getPath(): string {
        return parseFilepath(this.editor.getPath());
    }

    // Editor Events

    activate() {
        this.view.activatePanel();
    }

    deactivate() {
        this.view.activatePanel();
    }

    destroy() {
        this.commander.quit();
        this.view.destroy();
        this.disposables.dispose();
    }
}
