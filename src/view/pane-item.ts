import * as path from 'path';
import { EventEmitter } from 'events';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

// Events
export const OPEN = 'OPEN';
export const CLOSE = 'CLOSE';

export default class PaneItem {
    private emitter: EventEmitter;
    private subscriptions: CompositeDisposable;

    // True if event CLOSE was invoked by PaneItem::close
    private closedDeliberately: boolean;

    // null if closed
    private paneItem: any;

    constructor(private editor: any, private name: string) {
        this.subscriptions = new CompositeDisposable;
        this.emitter = new EventEmitter;
        this.closedDeliberately = false;
        this.subscriptions.add(atom.workspace.addOpener(this.opener));
    }

    destroy() {
        this.subscriptions.dispose();
    }

    private createPaneItem(): any {
        // classList
        const paneItem = document.createElement('article');
        paneItem.classList.add('agda-view');
        // title
        const base = path.basename(this.editor.getPath())
        const ext = path.extname(base)
        const title = `[Agda Mode] ${base.substr(0, base.length - ext.length)}`
        // methods
        paneItem['getURI'] = this.getURI;
        paneItem['getTitle'] = () => title;
        paneItem['getEditor'] = () => this.editor;
        paneItem.id =this.editor.id;

        return paneItem;
    }

    private opener = (uri: string) => {
        // e.g. "agda-mode://12312/view"
        //       [scheme ]   [dir] [name]
        const [scheme, pathRest] = uri.split('://');
        const { dir, name } = path.parse(pathRest);

        const openedByAgdaMode = scheme === 'agda-mode';
        const openedByTheSameEditor = dir === this.editor.id.toString();
        const openedForTheSamePurpose = name === this.name;
        if (openedByAgdaMode && openedByTheSameEditor && openedForTheSamePurpose) {
            return this.createPaneItem();
        } else {
            return null;
        }
    }

    // a predicate that decides if a pane item belongs to itself
    private isOwnedPaneItem(paneItem: any): boolean {
        return paneItem.getEditor().id === this.editor.id;
    }

    // methods
    getURI = (): string => {
        return `agda-mode://${this.editor.id}/${this.name}`
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
            this.emitter.emit(OPEN, paneItem, {
                previous: previousActivePane,
                current: currentPane
            });

            // on destroy
            if (currentPane) {
                this.subscriptions.add(currentPane.onWillDestroyItem(event => {
                    if (this.isOwnedPaneItem(event.item)) {
                        this.paneItem = null;
                        this.emitter.emit(CLOSE, paneItem, this.closedDeliberately);
                        // reset flags
                        this.closedDeliberately = false;
                    }
                }));
            }
        })
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

    // events
    onOpen(callback: (any, panes?: {
        previous: any,
        current: any
    }) => void) {
        this.emitter.on(OPEN, callback);
    }

    onClose(callback: (any, boolean?) => void) {
        this.emitter.on(CLOSE, callback);
    }
}
