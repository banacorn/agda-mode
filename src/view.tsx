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
    public store: Redux.Store<V.State>;
    public miniEditor: MiniEditor;
    private mountingPosition: HTMLElement;
    private bottomPanel: any;

    constructor(private core: Core) {
        this.store = createStore(reducer);
        this.subscriptions = new CompositeDisposable;

        // global events
        const emitter = this.store.getState().emitter;
        emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });


        atom.workspace.addOpener((uriToOpen: string) => {
            const [protocol, path] = uriToOpen.split('://');
            if (protocol === 'agda-mode') {
                return this.createEditor(path);
            }
        });
    }

    private isAgdaView() {
        return false;
    }

    private uri() {
        return `agda-mode://${this.core.editor.id}`;
    }

    private state() {
        return this.store.getState().view;
    }

    private createEditor(path: string) {
        const editor = document.createElement('article');
        editor.classList.add('agda-view');
        editor['getURI'] = () => this.uri();
        editor['getTitle'] = () => `Agda Mode ${path}`;
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
                        console.log(`to pane`)
                        this.unmount();
                        this.mount();
                    }}
                    mountAtBottom={() => {
                        console.log(`to bottom`)
                        this.unmount();
                        this.mount();
                    }}
                />
            </Provider>,
            this.mountingPosition
        )
    }

    mount() {
        if (!this.state().mounted) {
            console.log(`mount ${this.state().mountAt.current}`)
            // Redux
            this.store.dispatch(Action.mountView());

            switch (this.state().mountAt.current) {
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
                    const uri = this.uri();
                    const previousActivePane = atom.workspace.getActivePane()
                    atom.workspace.open(uri, {
                        searchAllPanes: true,
                        split: 'right'
                    }).then(view => {
                        // mounting position
                        this.mountingPosition = view;
                        previousActivePane.activate();
                        // render
                        this.render();
                    })
                    break;
                default:
                    console.error('no mounting position to transist to')
            }
        }
    }

    unmount() {
        if (this.state().mounted) {
            console.log(`unmount ${this.state().mountAt.previous}`)
            // Redux
            this.store.dispatch(Action.unmountView());
            // React
            ReactDOM.unmountComponentAtNode(this.mountingPosition);
            // mounting position
            this.mountingPosition = null;

            switch (this.state().mountAt.previous) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    this.bottomPanel.destroy();
                    break;
                case V.MountingPosition.Pane:
                    // destroy the editor
                    const pane = atom.workspace.paneForURI(this.uri());
                    if (pane) {
                        const editor = pane.itemForURI(this.uri());
                        pane.destroyItem(editor);
                    }
                    break;
                default:
                    // do nothing
                    break;
            }
        }
    }

    activate() {
        if (this.state().mountAt.current === V.MountingPosition.Bottom) {
            this.store.dispatch(activateView());
        } else {

        }
    }

    deactivate() {
        if (this.state().mountAt.current === V.MountingPosition.Bottom) {
            this.store.dispatch(deactivateView());
        } else {

        }
    }

    // destructor
    destroy() {
        console.log('destroy')
        this.unmount();
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
