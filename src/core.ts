import * as _ from 'lodash';
type CompositeDisposable = any;
type Range = any;
declare var atom: any;
var { Range, CompositeDisposable } = require('atom');
import { parseFilepath } from './parser';
import * as Redux from 'redux';
import { View } from './types';

// # Components
import Commander from './commander';
import Process from './process';
import TextBuffer from './text-buffer';
import InputMethod from './input-method';
import HighlightManager from './highlight-manager';
import ViewLegacy from './view-legacy';
import mountView from './view';

export default class Core {
    private disposables: CompositeDisposable;
    public view: ViewLegacy;
    public process: Process;
    public textBuffer: TextBuffer;
    public inputMethod: InputMethod;
    public highlightManager: HighlightManager;
    public commander: Commander;
    public store: Redux.Store<View.State>;

    public atomPanel: any;

    constructor(public editor: any) {

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

        // create an anchor element for the view to mount
        const anchor = document.createElement('agda-view');
        anchor.id = 'agda-view';
        const atomPanel = atom.workspace.addBottomPanel({
            item: anchor,
            visible: true,
            className: 'agda-view'
        });

        // initialize all components
        this.disposables        = new CompositeDisposable();
        this.store              = mountView(this);
        this.view               = new ViewLegacy;
        this.process            = new Process(this);
        this.textBuffer         = new TextBuffer(this);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod    = new InputMethod(this);
        this.highlightManager   = new HighlightManager(this);


        // instantiate views
        this.atomPanel = atom.workspace.addBottomPanel({
            item: document.createElement('agda-view'),
            visible: false,
            className: 'agda-view'
        });
        this.view.$mount(this.atomPanel.item);
        this.view.$on('jump-to-goal', (index) => {
            this.textBuffer.jumpToGoal(parseInt(index.substr(1)));
        });
        this.view.$on('jump-to-location', (location) => {
            this.textBuffer.jumpToLocation(location);
        });

        this.commander  = new Commander(this);

    }

    // shorthand for getting the path of the binded file
    getPath(): string {
        return parseFilepath(this.editor.getPath());
    }

    // Editor Events

    activate() {
        this.atomPanel.show();
    }

    deactivate() {
        this.atomPanel.hide();
    }

    destroy() {
        this.commander.quit();
        this.atomPanel.destroy();
        this.disposables.dispose();
    }
}
