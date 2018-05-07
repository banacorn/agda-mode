"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const React = require("react");
const ReactDOM = require("react-dom");
const path = require("path");
const react_redux_1 = require("react-redux");
const redux_1 = require("redux");
const events_1 = require("events");
const redux_thunk_1 = require("redux-thunk");
const Panel_1 = require("./view/component/Panel");
const Settings_1 = require("./view/component/Settings");
const reducers_1 = require("./view/reducers");
const actions_1 = require("./view/actions");
const Action = require("./view/actions");
const actions_2 = require("./view/actions");
const tab_1 = require("./view/tab");
const error_1 = require("./error");
const atom_1 = require("atom");
class EditorViewManager {
    constructor(main) {
        this.main = main;
    }
    // focus the specified editor
    focus(editor) {
        switch (editor) {
            case 'main':
                atom.views.getView(this.main).focus();
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
    focused() {
        if (this.general && this.general.isFocused())
            return 'general';
        if (this.connection && this.connection.isFocused())
            return 'connection';
        return 'main';
    }
    // get the focused editor
    getFocusedEditor() {
        const kind = this.focused();
        switch (kind) {
            case 'main':
                return this.main;
            case 'general':
            case 'connection':
                return this[kind].getModel();
        }
    }
}
class PanelManager {
    constructor(store) {
        this.store = store;
    }
}
class View {
    constructor(core) {
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default, redux_1.applyMiddleware(redux_thunk_1.default));
        // global events
        this.emitter = new events_1.EventEmitter;
        this.emitter.on(actions_1.EVENT.JUMP_TO_GOAL, (index) => {
            this.core.editor.jumpToGoal(index);
        });
        this.emitter.on(actions_1.EVENT.JUMP_TO_LOCATION, (loc) => {
            this.core.editor.jumpToLocation(loc);
        });
        this.emitter.on(actions_1.EVENT.FILL_IN_SIMPLE_SOLUTION, (solution) => {
            this.core.editor.goal.pointing()
                .then(goal => {
                goal.setContent(solution);
                this.core.commander.dispatch({ kind: 'Give' });
            })
                .catch(error_1.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['Please place the cursor in the goal before filling in the solution'], 3 /* Error */);
                return [];
            });
        });
        this.emitter.on(actions_1.EVENT.FILL_IN_INDEXED_SOLUTIONS, (solutions) => {
            const thunks = solutions.map(({ goalIndex, expr }) => () => {
                this.core.editor.goal.find(goalIndex).setContent(expr);
                this.core.editor.goal.find(goalIndex).selectContent();
                return this.core.commander.dispatch({ kind: 'Give' });
            });
            Promise.each(thunks, thunk => {
                // invoke the thunk
                return thunk();
            }).then(() => {
                // Load after Giving all solutions
                return this.core.commander.dispatch({ kind: 'Load' });
            });
        });
        // the event emitter garbage collector
        this.subscriptions = new atom_1.CompositeDisposable;
        // views of editors
        this.editors = new EditorViewManager(core.editor.getTextEditor());
        // the main panel
        this.panel = new PanelManager(this.store);
        // Tab for <Panel>
        this.panelTab = new tab_1.default(this.editors.main, 'panel');
        this.panelTab.onOpen((item, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render
            this.renderPanel(item.element);
        });
        this.panelTab.onKill(paneItem => {
            this.store.dispatch(Action.VIEW.mountAtBottom());
            this.unmountPanel(0 /* Pane */);
            this.mountPanel(1 /* Bottom */);
        });
        // Tab for <Settings>
        this.settingsTab = new tab_1.default(this.editors.main, 'settings', () => {
            const { name } = path.parse(this.editors.main.getPath());
            return `[Settings] ${name}`;
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
    state() {
        return this.store.getState().view;
    }
    renderPanel(mountingPoint) {
        ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
            React.createElement(Panel_1.default, { core: this.core, emitter: this.emitter })), mountingPoint);
    }
    renderSettingsView() {
        ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
            React.createElement(Settings_1.default, { core: this.core })), this.settingsTab.getElement());
    }
    mountPanel(mountAt) {
        if (!this.state().mounted) {
            // console.log(`[${this.editor.id}] %cmount at ${toText(mountAt)}`, 'color: green')
            // Redux
            this.store.dispatch(Action.VIEW.mount());
            switch (mountAt) {
                case 1 /* Bottom */:
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
                case 0 /* Pane */:
                    this.panelTab.open();
                    break;
                default:
                    console.error('no mounting position to transist to');
            }
        }
    }
    unmountPanel(mountAt) {
        if (this.state().mounted) {
            // console.log(`[${this.editor.id}] %cunmount at ${toText(mountAt)}`, 'color: orange')
            // Redux
            this.store.dispatch(Action.VIEW.unmount());
            switch (mountAt) {
                case 1 /* Bottom */:
                    this.bottomPanel.destroy();
                    const itemElement = this.bottomPanel.getItem();
                    ReactDOM.unmountComponentAtNode(itemElement);
                    break;
                case 0 /* Pane */:
                    // saving the element for React to unmount
                    const element = this.panelTab.getElement();
                    ReactDOM.unmountComponentAtNode(element);
                    this.panelTab.close();
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
        });
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                // do nothing
                break;
            case 0 /* Pane */:
                this.panelTab.activate();
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
    set(header, payload, type = 0 /* PlainText */) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main');
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.store.dispatch(actions_2.updatePlainText(payload.join('\n')));
    }
    setAgdaError(error, isWarning = false) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main');
        this.store.dispatch(actions_2.updateError(error));
        if (error) {
            this.store.dispatch(Action.HEADER.update({
                style: isWarning ? 4 /* Warning */ : 3 /* Error */,
                text: isWarning ? 'Warning' : error.header,
            }));
        }
        else {
            this.store.dispatch(Action.HEADER.update({
                style: isWarning ? 4 /* Warning */ : 3 /* Error */,
                text: isWarning ? 'Warning' : 'Error'
            }));
        }
    }
    setJudgements(header = 'Judgements', body) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main');
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: 1 /* Info */
        }));
        this.store.dispatch(actions_2.updateBody(body));
    }
    setSolutions(solutions) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focus('main');
        this.store.dispatch(Action.HEADER.update({
            text: 'Auto',
            style: 1 /* Info */
        }));
        this.store.dispatch(actions_2.updateSolutions(solutions));
    }
    query(header = '', message = [], type = 0 /* PlainText */, placeholder = '', inputMethodOn = true) {
        this.store.dispatch(Action.QUERY.setPlaceholder(placeholder));
        this.store.dispatch(Action.MODE.query());
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.editors.general.activate();
        return this.editors.general.query();
    }
    queryConnection() {
        this.settingsTab.open();
        this.store.dispatch(Action.VIEW.navigate('/Connection'));
        //
        // // update the view
        // this.store.dispatch(Action.MODE.queryConnection());
        // this.store.dispatch(Action.HEADER.update({
        //     text: 'Connection Error',
        //     style: V.Style.Error
        // }));
        // // activate the connection query
        // this.editors.connection.activate();
        return this.editors.connection.query();
    }
    toggleDocking() {
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                this.store.dispatch(Action.VIEW.mountAtPane());
                this.unmountPanel(1 /* Bottom */);
                this.mountPanel(0 /* Pane */);
                break;
            case 0 /* Pane */:
                this.store.dispatch(Action.VIEW.mountAtBottom());
                this.unmountPanel(0 /* Pane */);
                this.mountPanel(1 /* Bottom */);
                break;
            default:
                // do nothing
                break;
        }
        return Promise.resolve({});
    }
    navigateSettings(path) {
        this.store.dispatch(Action.VIEW.navigate(path));
    }
}
exports.default = View;
function toText(mp) {
    switch (mp) {
        case 1 /* Bottom */:
            return 'Bottom';
        case 0 /* Pane */:
            return 'Pane';
        default:
            return '';
    }
}
//# sourceMappingURL=view.js.map