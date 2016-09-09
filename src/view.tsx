import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/component/Panel';
import MiniEditor from './view/component/MiniEditor';
import reducer from './view/reducers';
import { View as V, Location } from './types';
import { EVENT } from "./view/actions";
import * as Action from "./view/actions";
import { parseContent, parseError} from './parser';
import { activateView, deactivateView, enableInMiniEditor } from './view/actions';
import { updateHeader, activateMiniEditor, updateBody, updateBanner, updateError, updatePlainText } from './view/actions';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

export default class View {
    private subscriptions: CompositeDisposable;
    private paneItemSubscriptions: CompositeDisposable;
    public paneItemDestroyedByAtom: boolean;

    public store: Redux.Store<V.State>;
    public miniEditor: MiniEditor;
    private mountingPosition: HTMLElement;
    private bottomPanel: any;
    private uri: string;

    constructor(private core: Core) {
        this.store = createStore(reducer);
        this.subscriptions = new CompositeDisposable;
        this.paneItemSubscriptions = new CompositeDisposable;
        this.paneItemDestroyedByAtom = true;

        this.uri = `agda-mode://${this.core.editor.id}`;
        // global events
        const emitter = this.store.getState().emitter;
        emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });


        this.subscriptions.add(atom.workspace.addOpener((uri: string) => {
            const {protocol, path} = this.parseURI(uri);

            const openedByAgdaMode = protocol === 'agda-mode';
            const openedByTheSameEditor = path === this.core.editor.id.toString();
            if (openedByAgdaMode && openedByTheSameEditor) {
                return this.createEditor(path);
            }
        }));

        // onWillDestroyPaneItem(callback)


    }

    private parseURI(uri: string) {
        const [protocol, path] = uri.split('://');
        return {
            protocol: protocol,
            path: path
        }
    }

    private ownedPaneItem(item: any) {

        return false;
    }

    private state() {
        return this.store.getState().view;
    }

    private createEditor(path: string) {
        const editor = document.createElement('article');
        editor.classList.add('agda-view');
        editor['getURI'] = () => {
            const uri = this.uri;
            return uri
        };
        editor['getTitle'] = () => `Agda Mode ${path}`;
        editor.id = this.uri;
        return editor;
    }

    private render() {
        if (this.mountingPosition === null) {
            console.error(`this.mountingPosition === null`)
        }
        ReactDOM.render(
            <Provider store={this.store}>
                <Panel
                    core={this.core}
                    onMiniEditorMount={(editor) => {
                        this.miniEditor = editor;
                    }}
                    mountAtPane={() => {
                        this.unmount(this.state().mountAt.previous);
                        this.mount(this.state().mountAt.current);
                    }}
                    mountAtBottom={() => {
                        this.unmount(this.state().mountAt.previous);
                        this.mount(this.state().mountAt.current);
                        console.log(`[${this.uri.substr(12)}] %cstate of activation: ${this.state().activated}`, 'color: cyan')
                    }}
                />
            </Provider>,
            this.mountingPosition
        )
    }

    mount(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
            console.log(`[${this.uri.substr(12)}] %cmount at ${toText(mountAt)}`, 'color: green')
            // Redux
            this.store.dispatch(Action.mountView());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    this.mountingPosition = document.createElement('article');
                    this.bottomPanel = atom.workspace.addBottomPanel({
                        item: this.mountingPosition,
                        visible: true,
                        className: 'agda-view'
                    });
                    // render
                    this.render();
                    break;
                case V.MountingPosition.Pane:
                    const uri = this.uri;
                    const previousActivePane = atom.workspace.getActivePane()
                    atom.workspace.open(uri, {
                        searchAllPanes: true,
                        split: 'right'
                    }).then(view => {
                        // mounting position
                        this.mountingPosition = view;
                        previousActivePane.activate();

                        // on destroy
                        const pane = atom.workspace.paneForItem(this.mountingPosition);
                        if (pane) {
                            this.paneItemSubscriptions.add(pane.onWillDestroyItem(event => {
                                if (event.item.getURI() === this.uri) {
                                    console.log(`[${this.uri.substr(12)}] %cpane item destroyed by ${this.paneItemDestroyedByAtom ? `Atom` : 'agda-mode'}`, 'color: red');
                                    if (this.paneItemDestroyedByAtom) {
                                        this.store.dispatch(Action.mountAtBottom());
                                        this.unmountPrim(V.MountingPosition.Pane);
                                        this.mount(V.MountingPosition.Bottom);
                                        console.log(`[${this.uri.substr(12)}] %cstate of activation: ${this.state().activated}`, 'color: cyan')
                                    } else {
                                        this.paneItemDestroyedByAtom = true;
                                    }
                                }
                            }));
                        }

                        // render
                        this.render();
                    })
                    break;
                default:
                    console.error('no mounting position to transist to')
            }
        }
    }

    unmount(mountAt: V.MountingPosition) {
        switch (mountAt) {
            case V.MountingPosition.Bottom:
                // do nothing
                break;
            case V.MountingPosition.Pane:
                this.paneItemDestroyedByAtom = false;
                break;
            default:
                // do nothing
                break;
        }
        this.unmountPrim(mountAt);
    }

    private unmountPrim(mountAt: V.MountingPosition) {
        if (this.state().mounted) {
            console.log(`[${this.uri.substr(12)}] %cunmount at ${toText(mountAt)}`, 'color: orange')
            // Redux
            this.store.dispatch(Action.unmountView());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    this.bottomPanel.destroy();
                    break;
                case V.MountingPosition.Pane:
                    // destroy the editor, but don't bother if it's already destroyed by Atom
                    if (!this.paneItemDestroyedByAtom) {
                        const pane = atom.workspace.paneForItem(this.mountingPosition);
                        if (pane) {
                            pane.destroyItem(this.mountingPosition);
                            // unsubscribe
                            this.paneItemSubscriptions.dispose();
                        }
                    }
                    break;
                default:
                    // do nothing
                    break;
            }

            // React
            ReactDOM.unmountComponentAtNode(this.mountingPosition);
            // mounting position
            this.mountingPosition = null;
        }
    }

    activate() {
        console.log(`[${this.uri.substr(12)}] %cactivated`, 'color: blue')
        this.store.dispatch(activateView());
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                // do nothing
                break;
            case V.MountingPosition.Pane:
                const pane = atom.workspace.paneForItem(this.mountingPosition);
                if (pane)
                    pane.activateItem(this.mountingPosition);
                break;
            default:
                // do nothing
                break;
        }
    }

    deactivate() {
        console.log(`[${this.uri.substr(12)}] %cdeactivated`, 'color: purple')
        this.store.dispatch(deactivateView());
    }

    // destructor
    destroy() {
        console.log(`[${this.uri.substr(12)}] %cdestroy`, 'color: red');
        this.unmount(this.state().mountAt.current);
        this.subscriptions.dispose();
    }

    set(header: string, payload: string[], type = V.Style.PlainText) {
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        if (type === V.Style.Info || type === V.Style.Success) {
            const { banner, body } = parseContent(payload);
            const grouped = _.groupBy(body, 'judgementForm');
            this.store.dispatch(updateBanner(banner));
            this.store.dispatch(updateBody({
                goal: (grouped['goal'] || []) as V.Goal[],
                judgement: (grouped['type judgement'] || []) as V.Judgement[],
                term: (grouped['term'] || []) as V.Term[],
                meta: (grouped['meta'] || []) as V.Meta[],
                sort: (grouped['sort'] || []) as V.Sort[]
            }));
        } else if (type === V.Style.Error) {
            const error = parseError(payload.join('\n'));
            this.store.dispatch(updateError(error));
        } else {
            this.store.dispatch(updatePlainText(payload.join('\n')));
        }
    }

    query(header: string = '', message: string[] = [], type: V.Style = V.Style.PlainText, placeholder: string = '', inputMethodOn = true): Promise<string> {
        this.store.dispatch(enableInMiniEditor(inputMethodOn));
        this.store.dispatch(activateMiniEditor(placeholder));
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        this.miniEditor.activate();
        return this.miniEditor.query();
    }
}

function toText(mp: V.MountingPosition): string {
    switch (mp) {
        case V.MountingPosition.Bottom:
            return 'Bottom;'
        case V.MountingPosition.Pane:
            return 'Pane'
        default:
            return ''
    }

}
