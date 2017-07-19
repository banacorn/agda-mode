import * as _ from 'lodash';
import * as path from 'path';
import { EventEmitter } from 'events';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

// Events
export const OPEN = 'OPEN';
export const CLOSE = 'CLOSE';   // deliberately closing the pane item
export const KILL = 'KILL';     //  unintentionally destroying the pane item

interface Item {
    element: HTMLElement;
    getURI: () => string;
    getTitle: () => string;
    getDefaultLocation: () => string;
};

export default class PaneItem {
    private emitter: EventEmitter;
    private subscriptions: CompositeDisposable;

    // True if event CLOSE was invoked by PaneItem::close
    private closedDeliberately: boolean;

    // null if closed
    private item: Item;

    constructor(private editor: any, private name: string, getTitle?: () => string) {
        this.subscriptions = new CompositeDisposable;
        this.emitter = new EventEmitter;
        this.closedDeliberately = false;
        // this.subscriptions.add(atom.workspace.addOpener(this.opener));
        if (getTitle)
            this.getTitle = getTitle;
    }

    destroy() {
        this.subscriptions.dispose();
    }

    private createPaneItem(): Item {
        const element = document.createElement('article');
        element.classList.add('agda-mode');
        return {
            element,
            getURI: this.getURI,
            getTitle: this.getTitle,
            getDefaultLocation: () => 'right'
        }
    }

    // methods
    getTitle = (): string => {
        const { name } = path.parse(this.editor.getPath());
        return `[Agda Mode] ${name}`
    }

    getURI = (): string => {
        return `agda-mode://${this.editor.id}/${this.name}`
    }

    getPane = (): any => {
        return atom.workspace.paneForItem(this.item);
    }

    open(atPane?: any): Promise<any> {
        let options = {
            searchAllPanes: true,
            split: 'right'
        };
        const uri = this.getURI();
        const previousActivePane = atom.workspace.getActivePane();

        const item = this.createPaneItem();

        // return atom.workspace.open(uri, options).then(paneItem => {
        return atom.workspace.open(item).then(paneItem => {
            this.item = paneItem;
            // move to the specified pane (if any) and remain activated
            if (atPane) {
                this.getPane().moveItemToPane(paneItem, atPane, 1)

                setTimeout(() => {
                    this.activate();
                });
            }

            const pane = this.getPane();
            // on open
            this.emitter.emit(OPEN, paneItem, {
                previous: previousActivePane,
                current: pane
            });

            // on destroy
            if (pane) {
                this.subscriptions.add(pane.onWillDestroyItem(event => {
                    if (this.item && event.item.getURI() === uri) {
                        this.item = null;
                        if (this.closedDeliberately) {
                            this.emitter.emit(CLOSE, paneItem);
                        } else {
                            this.emitter.emit(KILL, paneItem);
                        }
                        // reset flags
                        this.closedDeliberately = false;
                    }
                }));
            }

            // pass it down the promise
            return paneItem;
        });
    }

    // idempotent, invoking PaneItem::close the second time won't have any effects
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

    isActive(): boolean {
        if (this.item) {
            const pane = this.getPane();
            if (pane && pane.isActive()) {
                return pane.getActiveItem().getURI() === this.getURI()
            }
        }
        return false;

    }

    ////////////////////////////////////
    //  Events
    ////////////////////////////////////


    onOpen(callback: (any, panes?: {
        previous: any,
        current: any
    }) => void) {
        this.emitter.on(OPEN, callback);
    }

    onClose(callback: (any) => void) {
        this.emitter.on(CLOSE, callback);
    }

    onKill(callback: (any) => void) {
        this.emitter.on(KILL, callback);
    }
}
