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
import { View as V, Location } from './type';
import { EVENT } from './view/actions';
import * as Action from './view/actions';
import { parseJudgements, parseError, AgdaError } from './parser';
import { updateBody, updateError, updatePlainText } from './view/actions';
import Tab from './view/tab';

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
        this.main = atom.views.getView(main);
    }

    // focus the specified editor
    focus(editor: 'main' | 'general' | 'connection') {
        switch (editor) {
            case 'main':
                this.main.focus();
                break;
            case 'general':
                this.general && this.general.focus();
                break;
            case 'connection':
                this.connection && this.connection.focus();
                break;
        }
    }

    // tells which editor is focused
    focused(): 'main' | 'general' | 'connection' {
        if (this.general && this.general.isFocused())
            return 'general';
        if (this.connection && this.connection.isFocused())
            return 'connection';
        return 'main';
    }

    // get the element of the focused editor
    getFocusedEditorElement() {
        return this[this.focused()].getModel();
    }
}

class PanelManager {
    private store: Redux.Store<V.State>;
    constructor(store) {
        this.store = store;
    }
}

export default class View {
    private emitter: EventEmitter;
    private subscriptions: CompositeDisposable;
    public store: Redux.Store<V.State>;
    public editors: EditorManager;
    public panel: PanelManager;
    private bottomPanel: any;

    private panelTab: Tab;
    public settingsTab: Tab;

    constructor(private core: Core) {
        this.store = createStore(
            reducer,
            applyMiddleware(ReduxThunk)
        );

        // global events
        this.emitter = new EventEmitter;
        this.emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        this.emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });

        // the event emitter garbage collector
        this.subscriptions = new CompositeDisposable;

        // editors
        this.editors = new EditorManager(core.editor);

        // the main panel
        this.panel = new PanelManager(this.store);

        // Tab for <Panel>
        this.panelTab = new Tab(this.editors.main.getModel(), 'panel');
        this.panelTab.onOpen((item, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render
            this.renderPanel(item.element);
        });

        this.panelTab.onKill(paneItem => {
            this.store.dispatch(Action.VIEW.mountAtBottom());
            this.unmountPanel(V.MountingPosition.Pane);
            this.mountPanel(V.MountingPosition.Bottom);
        });

        // Tab for <Settings>
        this.settingsTab = new Tab(this.editors.main.getModel(), 'settings', () => {
            const { name } = path.parse(this.editors.main.getModel().getPath());
            return `[Settings] ${name}`
        });
        this.settingsTab.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            this.renderSettingsView();
        });
        this.settingsTab.onKill(paneItem => {
            this.store.dispatch(Action.VIEW.toggleSettings());
        });
    }

    private state() {
        return this.store.getState().view;
    }


    private renderPanel(mountingPoint: HTMLElement) {
        ReactDOM.render(
            <Provider store={this.store}>
                <Panel
                    core={this.core}
                    emitter={this.emitter}
                />
            </Provider>,
            mountingPoint
        )
    }

    private renderSettingsView() {
        ReactDOM.render(
            <Provider store={this.store}>
                <Settings
                    core={this.core}
                />
            </Provider>,
            this.settingsTab.getElement()
        )
    }

    mountPanel(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
            // console.log(`[${this.editor.id}] %cmount at ${toText(mountAt)}`, 'color: green')
            // Redux
            this.store.dispatch(Action.VIEW.mount());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    const element = document.createElement('article');
                    this.bottomPanel = atom.workspace.addBottomPanel({
                        item: element,
                        visible: true,
                        className: 'agda-mode'
                    });
                    // render
                    this.renderPanel(element);
                    break;
                case V.MountingPosition.Pane:
                    this.panelTab.open()
                    break;
                default:
                    console.error('no mounting position to transist to')
            }
        }
    }

    unmountPanel(mountAt: V.MountingPosition) {
        if (this.state().mounted) {
            // console.log(`[${this.editor.id}] %cunmount at ${toText(mountAt)}`, 'color: orange')
            // Redux
            this.store.dispatch(Action.VIEW.unmount());


            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    this.bottomPanel.destroy();
                    ReactDOM.unmountComponentAtNode(this.bottomPanel.item);
                    break;
                case V.MountingPosition.Pane:
                    // saving the element for React to unmount
                    const element = this.panelTab.getElement();
                    ReactDOM.unmountComponentAtNode(element);
                    this.panelTab.close()
                    break;
                default:
                    // do nothing
                    break;
            }

        }
    }

    activatePanel() {
        setTimeout(() => {
            this.store.dispatch(Action.VIEW.activate());
        })
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                // do nothing
                break;
            case V.MountingPosition.Pane:
                this.panelTab.activate()
                break;
            default:
                // do nothing
                break;
        }
    }

    deactivatePanel() {
        // console.log(`[${this.uri.substr(12)}] %cdeactivated`, 'color: purple')
        this.store.dispatch(Action.VIEW.deactivate());
    }

    // destructor
    destroy() {
        // console.log(`[${this.uri.substr(12)}] %cdestroy`, 'color: red');
        this.unmountPanel(this.state().mountAt.current);
        this.subscriptions.dispose();
        this.panelTab.destroy();
        this.settingsTab.destroy();
    }

    // test(header: string, body: React.Component, type = V.Style.PlainText) {
    //     this.store.dispatch(Action.MODE.display());
    //     this.editors.focus('main')
    //
    //     this.store.dispatch(Action.HEADER.update({
    //         text: header,
    //         style: type
    //     }));
    //     // this.store.dispatch(updatePlainText(payload.join('\n')));
    // }

    set(header: string, payload: string[], type = V.Style.PlainText) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main')

        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.store.dispatch(updatePlainText(payload.join('\n')));

    }

    setAgdaError(error: AgdaError) {

        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main')

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

    setJudgements(header: string = 'Judgements', body: V.Body) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main')

        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: V.Style.Info
        }));

        this.store.dispatch(updateBody(body));
    }

    query(header: string = '', message: string[] = [], type: V.Style = V.Style.PlainText, placeholder: string = '', inputMethodOn = true): Promise<string> {
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
            text: 'Connection Error',
            style: V.Style.Error
        }));
        // activate the connection query
        this.editors.connection.activate();
        return this.editors.connection.query();
    }

    toggleDocking(): Promise<{}> {
        switch (this.state().mountAt.current) {
            case V.MountingPosition.Bottom:
                this.store.dispatch(Action.VIEW.mountAtPane());
                this.unmountPanel(V.MountingPosition.Bottom);
                this.mountPanel(V.MountingPosition.Pane);
                break;
            case V.MountingPosition.Pane:
                this.store.dispatch(Action.VIEW.mountAtBottom());
                this.unmountPanel(V.MountingPosition.Pane);
                this.mountPanel(V.MountingPosition.Bottom);
                break;
            default:
                // do nothing
                break;
        }
        return Promise.resolve({});
    }

    navigateSettings(path: V.SettingsPath) {
        this.store.dispatch(Action.SETTINGS.navigate(path));
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
