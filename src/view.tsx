import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';
import { EventEmitter } from 'events';
import { basename, extname } from 'path';

import Core from './core';
import Panel from './view/component/Panel';
import MiniEditor from './view/component/MiniEditor';
import reducer from './view/reducers';
import { View as V, Location } from './types';
import { EVENT } from "./view/actions";
import * as Action from "./view/actions";
import { parseContent, parseError} from './parser';
import { updateHeader, activateMiniEditor, updateBody, updateBanner, updateError, updatePlainText } from './view/actions';
import PaneItem from './view/pane-item';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

export default class View {
    private emitter: EventEmitter;
    private subscriptions: CompositeDisposable;
    private editor: any;
    public store: Redux.Store<V.State>;
    public miniEditor: MiniEditor;
    private mountingPosition: HTMLElement;
    private bottomPanel: any;
    private viewPaneItem: PaneItem;

    constructor(private core: Core) {
        this.store = createStore(reducer);
        this.emitter = new EventEmitter;
        this.subscriptions = new CompositeDisposable;
        this.editor = core.editor;

        // global events
        this.emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        this.emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });

        this.viewPaneItem = new PaneItem(this.editor, 'view');
        this.viewPaneItem.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item) 
            panes.previous.activate();
            // mounting position
            this.mountingPosition = paneItem;
            // render
            this.render();
        });

        this.viewPaneItem.onClose((paneItem, closedDeliberately) => {
            // console.log(`${paneItem.getURI()} closed ${closedDeliberately ? 'deliberately' : 'by atom'}`)
            if (closedDeliberately === false) {
                this.store.dispatch(Action.mountAtBottom());
                this.unmount(V.MountingPosition.Pane);
                this.mount(V.MountingPosition.Bottom);
            }
        });
    }

    private state() {
        return this.store.getState().view;
    }


    private render() {
        if (this.mountingPosition === null) {
            console.error(`this.mountingPosition === null`)
        }

        ReactDOM.render(
            <Provider store={this.store}>
                <Panel
                    core={this.core}
                    emitter={this.emitter}
                    onMiniEditorMount={(editor) => {
                        this.miniEditor = editor;
                    }}
                    toggleDevView={() => {
                        console.log(`toggle dev view: ${this.store.getState().view.devView}`)
                    }}
                    mountAtPane={() => {
                        this.unmount(this.state().mountAt.previous);
                        this.mount(this.state().mountAt.current);
                    }}
                    mountAtBottom={() => {
                        this.unmount(this.state().mountAt.previous);
                        this.mount(this.state().mountAt.current);
                        // console.log(`[${this.uri.substr(12)}] %cstate of activation: ${this.state().activated}`, 'color: cyan')
                    }}
                />
            </Provider>,
            this.mountingPosition
        )
    }

    getEditor(): any {
        return this.editor;
    }

    getFocusedEditor(): any {
        const miniEditorFocused = this.miniEditor && this.miniEditor.isFocused();
        if (miniEditorFocused)
            return this.miniEditor.getModel();
        else
            return this.editor;
    }

    mount(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
            // console.log(`[${this.editor.id}] %cmount at ${toText(mountAt)}`, 'color: green')
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
                    this.viewPaneItem.open()
                    break;
                default:
                    console.error('no mounting position to transist to')
            }
        }
    }

    unmount(mountAt: V.MountingPosition) {
        if (this.state().mounted) {
            // console.log(`[${this.editor.id}] %cunmount at ${toText(mountAt)}`, 'color: orange')
            // Redux
            this.store.dispatch(Action.unmountView());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    this.bottomPanel.destroy();
                    break;
                case V.MountingPosition.Pane:
                    this.viewPaneItem.close()
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
        // console.log(`[${this.uri.substr(12)}] %cactivated`, 'color: blue')
        setTimeout(() => {
            this.store.dispatch(Action.activateView());
        })
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                // do nothing
                break;
            case V.MountingPosition.Pane:
                this.viewPaneItem.activate()
                break;
            default:
                // do nothing
                break;
        }
    }

    deactivate() {
        // console.log(`[${this.uri.substr(12)}] %cdeactivated`, 'color: purple')
        this.store.dispatch(Action.deactivateView());
    }

    // destructor
    destroy() {
        // console.log(`[${this.uri.substr(12)}] %cdestroy`, 'color: red');
        this.unmount(this.state().mountAt.current);
        this.subscriptions.dispose();
        this.viewPaneItem.destroy();
    }

    set(header: string, payload: string[], type = V.Style.PlainText) {
        this.store.dispatch(Action.deactivateMiniEditor());
        atom.views.getView(this.getEditor()).focus()
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
            if (error) {
                this.store.dispatch(updateHeader({
                    style: V.Style.Error,
                    text: error.header
                }));
            }
        } else {
            this.store.dispatch(updatePlainText(payload.join('\n')));
        }
    }

    query(header: string = '', message: string[] = [], type: V.Style = V.Style.PlainText, placeholder: string = '', inputMethodOn = true): Promise<string> {
        this.store.dispatch(Action.enableInMiniEditor(inputMethodOn));
        this.store.dispatch(activateMiniEditor(placeholder));
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        this.miniEditor.activate();
        return this.miniEditor.query();
    }

    toggleDocking(): Promise<{}> {
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                this.store.dispatch(Action.mountAtPane());
                this.unmount(V.MountingPosition.Bottom);
                this.mount(V.MountingPosition.Pane);
                break;
            case V.MountingPosition.Pane:
                this.store.dispatch(Action.mountAtBottom());
                this.unmount(V.MountingPosition.Pane);
                this.mount(V.MountingPosition.Bottom);
                break;
            default:
                // do nothing
                break;
        }
        return Promise.resolve({});
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
