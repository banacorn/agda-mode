import * as _ from 'lodash';
import * as Promise from 'bluebird';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactDOM from 'react-dom';
import * as path from 'path';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { EventEmitter } from 'events';
import { basename, extname } from 'path';
import ReduxThunk from 'redux-thunk'

import Core from './core';
import Panel from './view/component/Panel';
import Settings from './view/component/Settings';
import MiniEditor from './view/component/MiniEditor';
import reducer from './view/reducers';
import { View as V, Location, Error } from './type';
import { EVENT } from "./view/actions";
import * as Action from "./view/actions";
import { parseJudgements, parseError } from './parser';
import { updateBody, updateBanner, updateError, updatePlainText } from './view/actions';
import PaneItem from './view/pane-item';

// Atom shits
type Editor = any;
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

class EditorManager {
    main: Editor;
    general: MiniEditor;
    connection: MiniEditor;

    constructor(main: Editor) {
        this.main = main;
    }

    focusMain() {
        atom.views.getView(this.main).focus();
    }

    getFocusedEditor() {
        if (this.general && this.general.isFocused())
            return this.general.getModel();

        if (this.connection && this.connection.isFocused())
            return this.connection.getModel();

        return this.main.getModel();
    }
}

export default class View {
    private emitter: EventEmitter;
    private subscriptions: CompositeDisposable;
    public store: Redux.Store<V.State>;
    public editors: EditorManager
    private mountingPosition: HTMLElement;
    private bottomPanel: any;
    private settingsViewElement: HTMLElement;
    private viewPaneItem: PaneItem;
    public settingsViewPaneItem: PaneItem;

    constructor(private core: Core) {
        this.store = createStore(
            reducer,
            applyMiddleware(ReduxThunk)
        );
        this.emitter = new EventEmitter;
        this.subscriptions = new CompositeDisposable;

        // editors
        this.editors = new EditorManager(core.editor);

        // global events
        this.emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        this.emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });

        // view pane item
        this.viewPaneItem = new PaneItem(this.editors.main, 'view');
        this.viewPaneItem.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // mounting position
            this.mountingPosition = paneItem;
            // render
            this.render();
        });

        this.viewPaneItem.onClose((paneItem, closedDeliberately) => {
            // console.log(`[${this.editor.id}] ${paneItem.getURI()} closed ${closedDeliberately ? 'deliberately' : 'by atom'}`)
            if (closedDeliberately === false) {
                this.store.dispatch(Action.VIEW.mountAtBottom());
                this.unmount(V.MountingPosition.Pane);
                this.mount(V.MountingPosition.Bottom);
            }
        });

        // initialize settings view
        this.settingsViewPaneItem = new PaneItem(this.editors.main, 'settings', () => {
            const { name } = path.parse(this.editors.main.getPath());
            return `[Settings] ${name}`
        });
        this.settingsViewPaneItem.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();

            this.settingsViewElement = paneItem;

            this.renderSettingsView()
        });
        this.settingsViewPaneItem.onClose((paneItem, closedDeliberately) => {
            if (closedDeliberately === false) {
                this.store.dispatch(Action.VIEW.toggleSettings());
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
                />
            </Provider>,
            this.mountingPosition
        )
    }

    private renderSettingsView() {
        if (this.settingsViewElement === null) {
            console.error(`this.settingsViewElement === null`)
        }

        ReactDOM.render(
            <Provider store={this.store}>
                <Settings
                    core={this.core}
                />
            </Provider>,
            this.settingsViewElement
        )
    }

    mount(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
            // console.log(`[${this.editor.id}] %cmount at ${toText(mountAt)}`, 'color: green')
            // Redux
            this.store.dispatch(Action.VIEW.mount());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    this.mountingPosition = document.createElement('article');
                    this.bottomPanel = atom.workspace.addBottomPanel({
                        item: this.mountingPosition,
                        visible: true,
                        className: 'agda-mode'
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
            this.store.dispatch(Action.VIEW.unmount());

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
        setTimeout(() => {
            this.store.dispatch(Action.VIEW.activate());
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
        this.store.dispatch(Action.VIEW.deactivate());
    }

    // destructor
    destroy() {
        // console.log(`[${this.uri.substr(12)}] %cdestroy`, 'color: red');
        this.unmount(this.state().mountAt.current);
        this.subscriptions.dispose();
        this.viewPaneItem.destroy();
    }

    set(header: string, payload: string[], type = V.Style.PlainText) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.store.dispatch(updatePlainText(payload.join('\n')));

    }

    setError(error: Error) {

        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.store.dispatch(Action.HEADER.update({
            text: 'Error',
            style: V.Style.Error
        }));

        this.store.dispatch(updateError(error));
        if (error) {
            this.store.dispatch(Action.HEADER.update({
                style: V.Style.Error,
                text: error.header
            }));
        }
    }

    setJudgements(header: string = 'Judgements', { banner, body }: V.Judgements) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: V.Style.Info
        }));

        this.store.dispatch(updateBanner(banner));

        const grouped = _.groupBy(body, 'judgementForm');
        this.store.dispatch(updateBody({
            goal: (grouped['goal'] || []) as V.Goal[],
            judgement: (grouped['type judgement'] || []) as V.Judgement[],
            term: (grouped['term'] || []) as V.Term[],
            meta: (grouped['meta'] || []) as V.Meta[],
            sort: (grouped['sort'] || []) as V.Sort[]
        }));
    }


    query(header: string = '', message: string[] = [], type: V.Style = V.Style.PlainText, placeholder: string = '', inputMethodOn = true): Promise<string> {
        this.store.dispatch(Action.INPUT_METHOD.enableInMiniEditor(inputMethodOn));
        this.store.dispatch(Action.QUERY.setPlaceholder(placeholder));
        this.store.dispatch(Action.MODE.query());
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.editors.general.activate();

        return this.editors.general.query();
    }

    queryConnection(): Promise<string> {
        // update the view
        this.store.dispatch(Action.MODE.queryConnection());
        this.store.dispatch(Action.HEADER.update({
            text: "Oh no!!",
            style: V.Style.Warning
        }));
        // activate the connection query
        this.editors.connection.activate();
        return this.editors.connection.query();
    }

    toggleDocking(): Promise<{}> {
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                this.store.dispatch(Action.VIEW.mountAtPane());
                this.unmount(V.MountingPosition.Bottom);
                this.mount(V.MountingPosition.Pane);
                break;
            case V.MountingPosition.Pane:
                this.store.dispatch(Action.VIEW.mountAtBottom());
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
            return 'Bottom'
        case V.MountingPosition.Pane:
            return 'Pane'
        default:
            return ''
    }

}
