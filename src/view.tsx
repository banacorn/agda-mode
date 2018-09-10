import * as Promise from 'bluebird';
import * as React from 'react';
import * as Redux from 'redux';
import * as ReactDOM from 'react-dom';
import * as path from 'path';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import { EventEmitter } from 'events';
import ReduxThunk from 'redux-thunk'

import { Resource } from './util';
import { Core } from './core';
import Panel from './view/component/Panel';
import Settings from './view/component/Settings';
import MiniEditor from './view/component/MiniEditor';
import reducer from './view/reducers';
import { Agda, View as V } from './type';
import { EVENT } from './view/actions';
import * as Action from './view/actions';
import { EmacsAgdaError } from './parser/emacs';
import Tab from './view/tab';
import { OutOfGoalError } from './error';
import * as TC from './type/agda/typeChecking';

import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

var { errorToHeader } = require('./view/component/Reason/Error.bs');
var { parseError } = require('./view/component/Reason/Decoder.bs');


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

    // get the focused editor
    getFocusedEditor(): Promise<Atom.TextEditor> {
        if (this.general && this.general.isFocused())
            return Promise.resolve(this.general.getModel());
        if (this.connection.isAvailable()) {
            return this.connection.access().then(editor => {
                if (editor.isFocused())
                    return editor.getModel();
                else
                    return this.main;
            });
        } else {
            return Promise.resolve(this.main);
        }
    }
}

class TabManager {
    private panel: Tab;
    private settings: Tab;

    constructor(
        private core: Core,
        private store: Redux.Store<V.State>,
        mainEditor: Atom.TextEditor
    ) {
        // Tab for <Panel>
        this.panel = new Tab(mainEditor, 'panel');
        this.panel.onOpen((tab, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render
            this.core.view.renderPanel(tab.getElement());
        });

        // open <Panel> at the bottom when this tab got destroyed
        this.panel.onKill(tab => {
            this.store.dispatch(Action.VIEW.mountAtBottom());
            this.core.view.unmountPanel(V.MountingPosition.Pane);
            this.core.view.mountPanel(V.MountingPosition.Bottom);
        });

        // Tab for <Settings>
        this.settings = new Tab(mainEditor, 'settings', () => {
            const { name } = path.parse(mainEditor.getPath());
            return `[Settings] ${name}`
        });
        this.settings.onOpen((_, panes) => {
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
        });

        this.settings.onKill(() => {
            this.store.dispatch(Action.VIEW.toggleSettings());
        });

    }

    open(tab: 'panel' | 'settings'): Promise<Tab> {
        switch(tab) {
            case 'panel':
                if (!this.panel.isActive()) {
                    return this.panel.open();
                } else {
                    return Promise.resolve(this.panel);
                }
            case 'settings':
                if (!this.settings.isActive()) {
                    return this.settings.open();
                } else {
                    return Promise.resolve(this.settings);
                }
        }
    }

    close(tab: 'panel' | 'settings') {
        switch(tab) {
            case 'panel':
                if (this.panel.isActive()) {
                    ReactDOM.unmountComponentAtNode(this.panel.getElement());
                    this.panel.close();
                }
                break;
            case 'settings':
                if (this.settings.isActive()) {
                    ReactDOM.unmountComponentAtNode(this.settings.getElement());
                    this.settings.close();
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
    public static EventContext = React.createContext(new EventEmitter);
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
        this.emitter.on(EVENT.JUMP_TO_RANGE, (range: Atom.Range, source: string) => {
            this.core.editor.jumpToRange(range, source);
        });
        this.emitter.on(EVENT.MOUSE_OVER, (range: Atom.Range, source: string) => {
            this.core.editor.mouseOver(range);
        });
        this.emitter.on(EVENT.MOUSE_OUT, (range: Atom.Range, source: string) => {
            this.core.editor.mouseOut();
        });
        this.emitter.on(EVENT.FILL_IN_SIMPLE_SOLUTION, (solution: string) => {
            this.core.editor.goal.pointing()
                .then(goal => {
                    goal.setContent(solution);
                    this.core.commander.dispatch({ kind: 'Give' });
                })
                .catch(OutOfGoalError, () => {
                    this.core.view.set('Out of goal', 'Please place the cursor in the goal before filling in the solution', V.Style.Error);
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
                <View.EventContext.Provider value={this.emitter}>
                    <Panel
                        core={this.core}
                    />
                </View.EventContext.Provider>
            </Provider>,
            mountingPoint
        )
    }

    mountPanel(mountAt: V.MountingPosition) {
        if (!this.state().mounted) {
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
        this.store.dispatch(Action.VIEW.deactivate());
    }

    // destructor
    destroy() {
        this.unmountPanel(this.state().mountAt.current);
        this.subscriptions.dispose();
        this.tabs.destroyAll();
    }

    set(header: string, payload: string, type = V.Style.PlainText) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.store.dispatch(Action.updatePlainText(payload));
    }

    // for JSON
    setAgdaError(tsError: TC.Error, emacsMsg: string) {
        console.log(tsError)
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()
        this.store.dispatch(Action.updateError([tsError, emacsMsg]));
        this.store.dispatch(Action.HEADER.update({
            style: V.Style.Error,
            text: errorToHeader(parseError(tsError)),
        }));
    }

    // for Emacs
    setEmacsAgdaError(error: EmacsAgdaError, isWarning: boolean = false) {

        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain()

        this.store.dispatch(Action.updateEmacsError(error));
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

        this.store.dispatch(Action.updateBody(body));
    }

    setSolutions(solutions: V.Solutions) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();

        this.store.dispatch(Action.HEADER.update({
            text: 'Auto',
            style: V.Style.Info
        }));

        this.store.dispatch(Action.updateSolutions(solutions));
    }

    query(header: string = '', _: string[] = [], type: V.Style = V.Style.PlainText, placeholder: string = '', inputMethodOn = true): Promise<string> {
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
        return this.tabs.open('settings').then(() => {
            this.store.dispatch(Action.VIEW.navigate({path: '/Connection'}));
            return this.editors.connection.access()
                .then(editor => {
                    if (!editor.isFocused()) {
                        editor.activate()
                    }
                    return editor.query();
                });
        });
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
}
