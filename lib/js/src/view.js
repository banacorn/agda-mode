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
const util_1 = require("./util");
const Panel_1 = require("./view/component/Panel");
const Settings_1 = require("./view/component/Settings");
const reducers_1 = require("./view/reducers");
const actions_1 = require("./view/actions");
const Action = require("./view/actions");
const tab_1 = require("./view/tab");
const atom_1 = require("atom");
var { errorToHeader } = require('./Reason/View/TypeChecking/Error.bs');
var { parseError, parseMetas } = require('./Reason/Decoder.bs');
class EditorViewManager {
    constructor(main) {
        this.main = main;
        this.connection = new util_1.Resource;
    }
    focusMain() {
        atom.views.getView(this.main).focus();
    }
    // get the focused editor
    getFocusedEditor() {
        if (this.general && this.general.isFocused())
            return Promise.resolve(this.general.getModel());
        if (this.connection.isAvailable()) {
            return this.connection.access().then(editor => {
                if (editor.isFocused())
                    return editor.getModel();
                else
                    return this.main;
            });
        }
        else {
            return Promise.resolve(this.main);
        }
    }
}
class TabManager {
    constructor(core, store, mainEditor) {
        this.core = core;
        this.store = store;
        // Tab for <Panel>
        this.panel = new tab_1.default(mainEditor, 'panel');
        this.panel.onOpen((tab, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render
            this.core.view.renderPanel(tab.getElement());
        });
        // open <Panel> at the bottom when this tab got destroyed
        this.panel.onKill(tab => {
            this.store.dispatch(Action.VIEW.mountAtBottom());
            this.core.view.unmountPanel(0 /* Pane */);
            this.core.view.mountPanel(1 /* Bottom */);
        });
        // Tab for <Settings>
        this.settings = new tab_1.default(mainEditor, 'settings', () => {
            const { name } = path.parse(mainEditor.getPath());
            return `[Settings] ${name}`;
        });
        this.settings.onOpen((_, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            // render the view
            ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
                React.createElement(Settings_1.default, { core: this.core })), this.settings.getElement());
        });
        this.settings.onKill(() => {
            this.store.dispatch(Action.VIEW.toggleSettings());
        });
    }
    open(tab) {
        switch (tab) {
            case 'panel':
                if (!this.panel.isActive()) {
                    return this.panel.open();
                }
                else {
                    return Promise.resolve(this.panel);
                }
            case 'settings':
                if (!this.settings.isActive()) {
                    return this.settings.open();
                }
                else {
                    return Promise.resolve(this.settings);
                }
        }
    }
    close(tab) {
        switch (tab) {
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
    activate(tab) {
        switch (tab) {
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
class View {
    constructor(core) {
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default, redux_1.applyMiddleware(redux_thunk_1.default));
        // global events
        this.emitter = new events_1.EventEmitter;
        this.emitter.on(actions_1.EVENT.JUMP_TO_GOAL, (index) => {
            this.core.editor.jumpToGoal(index);
        });
        this.emitter.on(actions_1.EVENT.JUMP_TO_RANGE, (range, source) => {
            this.core.editor.jumpToRange(range, source);
        });
        this.emitter.on(actions_1.EVENT.MOUSE_OVER, (range, source) => {
            this.core.editor.mouseOver(range);
        });
        this.emitter.on(actions_1.EVENT.MOUSE_OUT, (range, source) => {
            this.core.editor.mouseOut();
        });
        // the event emitter garbage collector
        this.subscriptions = new atom_1.CompositeDisposable;
        // views of editors
        this.editors = new EditorViewManager(core.editor.getTextEditor());
        // the tab manager
        this.tabs = new TabManager(this.core, this.store, core.editor.getTextEditor());
    }
    state() {
        return this.store.getState().view;
    }
    renderPanel(mountingPoint) {
        ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
            React.createElement(View.EventContext.Provider, { value: this.emitter },
                React.createElement(Panel_1.default, { core: this.core }))), mountingPoint);
    }
    mountPanel(mountAt) {
        if (!this.state().mounted) {
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
                    this.tabs.open('panel');
                    break;
                default:
                    console.error('no mounting position to transist to');
            }
        }
    }
    unmountPanel(mountAt) {
        if (this.state().mounted) {
            // Redux
            this.store.dispatch(Action.VIEW.unmount());
            switch (mountAt) {
                case 1 /* Bottom */:
                    this.bottomPanel.destroy();
                    const itemElement = this.bottomPanel.getItem();
                    ReactDOM.unmountComponentAtNode(itemElement);
                    break;
                case 0 /* Pane */:
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
        });
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                // do nothing
                break;
            case 0 /* Pane */:
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
    set(header, payload, type = 0 /* PlainText */) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.store.dispatch(Action.updatePlainText(payload));
    }
    // for JSON
    setAgdaError(tsError, emacsMsg) {
        console.log(tsError);
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.updateError([tsError, emacsMsg]));
        this.store.dispatch(Action.HEADER.update({
            style: 3 /* Error */,
            text: errorToHeader(parseError(tsError)),
        }));
    }
    setAgdaAllGoalsWarnings(raw) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            text: 'All Goals, Warnings, and Errors',
            style: 1 /* Info */
        }));
        console.log(parseMetas(raw));
        this.store.dispatch(Action.updateAllGoalsWarnings(parseMetas(raw)));
    }
    // for Emacs
    setEmacsError(error) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            style: 3 /* Error */,
            text: 'Error'
        }));
        this.store.dispatch(Action.updateEmacsError(error));
    }
    setEmacsAllGoalsWarnings(header = 'Judgements', allGoalsWarnings) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: 1 /* Info */
        }));
        this.store.dispatch(Action.updateEmacsAllGoalsWarnings([header, allGoalsWarnings]));
    }
    setEmacsGoalTypeContext(header = 'Judgements', goalTypeContext) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: 1 /* Info */
        }));
        this.store.dispatch(Action.updateEmacsGoalTypeContext(goalTypeContext));
    }
    setEmacsConstraints(constraints) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            text: 'Constraints',
            style: 1 /* Info */
        }));
        this.store.dispatch(Action.updateEmacsConstraints(constraints));
    }
    setEmacsSolutions(solutions) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.store.dispatch(Action.HEADER.update({
            text: 'Auto',
            style: 1 /* Info */
        }));
        this.store.dispatch(Action.updateEmacsSolutions(solutions));
    }
    query(header = '', _ = [], type = 0 /* PlainText */, placeholder = '', inputMethodOn = true) {
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
        return this.tabs.open('settings').then(() => {
            this.store.dispatch(Action.VIEW.navigate({ path: '/Connection' }));
            return this.editors.connection.access()
                .then(editor => {
                if (!editor.isFocused()) {
                    editor.activate();
                }
                return editor.query();
            });
        });
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
}
View.EventContext = React.createContext(new events_1.EventEmitter);
exports.default = View;
//# sourceMappingURL=view.js.map