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

import { Resource } from './util';
import { Core } from './core';
import Panel from './view/component/Panel';
import Settings from './view/component/Settings';
import MiniEditor from './view/component/MiniEditor';
import reducer from './view/reducers';
import { View as V, Location } from './type';
import { EVENT } from './view/actions';
import * as Action from './view/actions';
import { parseJudgements, parseError, AgdaError } from './parser';
import { updateBody, updateError, updatePlainText, updateSolutions } from './view/actions';
import Tab from './view/tab';
import { OutOfGoalError } from './error';

import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

type EditorType = 'main' | 'general' | 'connection';
class EditorViewManager {
    main: Atom.TextEditor;
    general: MiniEditor;
    connection: Resource<MiniEditor>;

    constructor(main: Atom.TextEditor) {
        this.main = main;
        this.connection = new Resource;
    }

    focusMain() {
        atom.views.getView(this.main).focus();
    }
    // // focus the specified editor
    // focus(editor: 'main' | 'general' | 'connection') {
    //     switch (editor) {
    //         case 'main':
    //             atom.views.getView(this.main).focus();
    //             break;
    //         case 'general':
    //             this.general && this.general.focus();
    //             break;
    //         case 'connection':
    //             this.connection.access()
    //                 .then(editor => {
    //                     editor.focus();
    //                 });
    //             break;
    //     }
    // }

    // get the focused editor
    getFocusedEditor(): Atom.TextEditor {
        if (this.general && this.general.isFocused())
            return this.general.getModel();
        if (this.connection.isAvailable()) {
            this.connection.access().then(editor => {
                if (editor.isFocused())
                    return editor.getModel();
                else
                    return this.main;
            });
        } else {
            return this.main;
        }
    }
}

class TabManager {
    private panel: Tab;
    private panelOpened: boolean;
    private settings: Tab;
    private settingsOpened: boolean;

    constructor(
        private core: Core,
        private store: Redux.Store<V.State>,
        mainEditor: Atom.TextEditor
    ) {
        // Tab for <Panel>
        this.panel = new Tab(mainEditor, 'panel');
        this.panel.onOpen((item, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render
            this.core.view.renderPanel(item.element);

            this.panelOpened = true;
        });
        this.panel.onClose(paneItem => {
            this.panelOpened = false;
        });

        // open <Panel> at the bottom when this tab got destroyed
        this.panel.onKill(paneItem => {
            this.store.dispatch(Action.VIEW.mountAtBottom());
            this.core.view.unmountPanel(V.MountingPosition.Pane);
            this.core.view.mountPanel(V.MountingPosition.Bottom);

            this.panelOpened = false;
        });

        // Tab for <Settings>
        this.settings = new Tab(mainEditor, 'settings', () => {
            const { name } = path.parse(mainEditor.getPath());
            return `[Settings] ${name}`
        });
        this.settings.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render the view
            ReactDOM.render(
                <Provider store={this.store}>
                    <Settings
                        core={this.core}
                    />
                </Provider>,
                this.settings.getElement()
            );

            this.settingsOpened = true;
        });

        this.settings.onClose(paneItem => {
            this.settingsOpened = false;
        });
        this.settings.onKill(paneItem => {
            this.settingsOpened = false;
            this.store.dispatch(Action.VIEW.toggleSettings());
        });

    }

    open(tab: 'panel' | 'settings') {
        switch(tab) {
            case 'panel':
                if (!this.panelOpened) {
                    this.panel.open();
                }
                break;
            case 'settings':
                if (!this.settingsOpened) {
                    this.settings.open();
                }
                break;
        }
    }

    close(tab: 'panel' | 'settings') {
        switch(tab) {
            case 'panel':
                if (this.panelOpened) {
                    ReactDOM.unmountComponentAtNode(this.panel.getElement());
                    this.panel.close();
                    this.panelOpened = false;
                }
                break;
            case 'settings':
                if (this.settingsOpened) {
                    ReactDOM.unmountComponentAtNode(this.settings.getElement());
                    this.settings.close();
                    this.settingsOpened = false;
                }
                break;
        }
    }
    activate(tab: 'panel' | 'settings') {
        switch(tab) {
            case 'panel':
                this.panel.activate();
                break;
            case 'settings':
                this.settings.activate();
                break;
        }
    }
    destroyAll() {
        this.panel.destroy();
        this.settings.destroy();
    }
}

export default class View {
    private emitter: EventEmitter;
    private subscriptions: Atom.CompositeDisposable;
    public store: Redux.Store<V.State>;
    public editors: EditorViewManager;
    private bottomPanel: Atom.Panel;
    public tabs: TabManager;

    constructor(private core: Core) {
        this.store = createStore(
            reducer,
            applyMiddleware(ReduxThunk)
        );

        // global events
        this.emitter = new EventEmitter;
        this.emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.editor.jumpToGoal(index);
        });
        this.emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.editor.jumpToLocation(loc);
        });
        this.emitter.on(EVENT.FILL_IN_SIMPLE_SOLUTION, (solution: string) => {
            this.core.editor.goal.pointing()
                .then(goal => {
                    goal.setContent(solution);
                    this.core.commander.dispatch({ kind: 'Give' });
                })
                .catch(OutOfGoalError, () => {
                    this.core.view.set('Out of goal', ['Please place the cursor in the goal before filling in the solution'], V.Style.Error);
                    return []
                })
        });

        this.emitter.on(EVENT.FILL_IN_INDEXED_SOLUTIONS, (solutions: {
            goalIndex: number;
            expr: string;
        }[]) => {
            const thunks = solutions.map(({goalIndex, expr}) => () => {
                this.core.editor.goal.find(goalIndex).setContent(expr);
                this.core.editor.goal.find(goalIndex).selectContent();
                return this.core.commander.dispatch({ kind: 'Give' });
            });

            Promise.each(thunks, thunk => {
                // invoke the thunk
                return thunk()
            }).then(() => {
                // Load after Giving all solutions
                return this.core.commander.dispatch({ kind: 'Load' });
            })
        });

        // the event emitter garbage collector
        this.subscriptions = new CompositeDisposable;

        // views of editors
        this.editors = new EditorViewManager(core.editor.getTextEditor());

        // the tab manager
        this.tabs = new TabManager(this.core, this.store, core.editor.getTextEditor());

    }

    private state() {
        return this.store.getState().view;
    }


    public renderPanel(mountingPoint: HTMLElement) {
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

    mountPanel(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
            // console.log(`[${this.editor.id}] %cmount at ${toText(mountAt)}`, 'color: green')
            // Redux
            this.store.dispatch(Action.VIEW.mount());

            switch (mountAt) {
                case V.MountingPosition.Bottom:
                    // mounting position
                    const element = document.createElement('article');
                    element.classList.add('agda-mode');
                    this.bottomPanel = atom.workspace.addBottomPanel({
                        item: element,
                        visible: true
                    });
                    // render
                    this.renderPanel(element);
                    break;
                case V.MountingPosition.Pane:
                    this.tabs.open('panel')
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
                    const itemElement = this.bottomPanel.getItem() as Element;
                    ReactDOM.unmountComponentAtNode(itemElement);
                    break;
                case V.MountingPosition.Pane:
                    this.tabs.close('panel');
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
                this.tabs.activate('panel');
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
        this.tabs.destroyAll();
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

    setAgdaError(error: AgdaError, isWarning: boolean = false) {

        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()


        this.store.dispatch(updateError(error));
        if (error) {
            this.store.dispatch(Action.HEADER.update({
                style: isWarning ? V.Style.Warning : V.Style.Error,
                text: isWarning ? 'Warning' : error.header,
            }));
        } else {
            this.store.dispatch(Action.HEADER.update({
                style: isWarning ? V.Style.Warning : V.Style.Error,
                text: isWarning ? 'Warning' : 'Error'
            }));
        }
    }

    setJudgements(header: string = 'Judgements', body: V.Body) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: V.Style.Info
        }));

        this.store.dispatch(updateBody(body));
    }

    setSolutions(solutions: V.Solutions) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();

        this.store.dispatch(Action.HEADER.update({
            text: 'Auto',
            style: V.Style.Info
        }));

        this.store.dispatch(updateSolutions(solutions));
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
        this.tabs.open('settings');
        this.store.dispatch(Action.VIEW.navigate('/Connection'));
        // this.editors.connection.query()
        //     .then(result => {
        //         console.log(result)
        //     })
        // console.log('before')
        this.editors.connection.access()
            .then(editor => editor.focus());
        // this.editors.focus('connection');
        // console.log('after')
        // this.focusAgdaConnectionInput
        //
        // // update the view
        // this.store.dispatch(Action.MODE.queryConnection());
        // this.store.dispatch(Action.HEADER.update({
        //     text: 'Connection Error',
        //     style: V.Style.Error
        // }));
        // // activate the connection query
        // this..activate();
        return this.editors.connection.access().then(editor => editor.query());
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

    navigateSettings(path: V.SettingsURI) {
        this.store.dispatch(Action.VIEW.navigate(path));
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
