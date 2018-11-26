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
// import Panel from './view/component/Panel';
const Settings_1 = require("./view/component/Settings");
const reducers_1 = require("./view/reducers");
const actions_1 = require("./view/actions");
const Action = require("./view/actions");
const tab_1 = require("./view/tab");
const util_2 = require("./util");
const error_1 = require("./error");
const atom_1 = require("atom");
var { errorToHeader } = require('./Reason/View/JSON/JSON__Error.bs');
var { parseWhyInScope } = require('./Reason/View/Emacs/Emacs__Parser.bs');
var Panel = require('./Reason/View/Panel/Panel.bs').jsComponent;
var Reason = require('./Reason/Decoder.bs');
class EditorViewManager {
    constructor(main) {
        this.main = main;
        this.connection = new util_1.Resource;
        this.general = new util_1.Resource;
        this.focus = 'main';
        this.queryGeneralTP = new util_2.TelePromise;
        this.queryConnectionTP = new util_2.TelePromise;
    }
    focusMain() {
        atom.views.getView(this.main).focus();
        this.focus = 'main';
    }
    setFocus(focus) {
        this.focus = focus;
    }
    generalIsFocused() { return this.focus === 'general'; }
    connectionIsFocused() { return this.focus === 'connection'; }
    // get the focused editor
    getFocusedEditor() {
        if (this.general.isAvailable()) {
            return this.general.access().then(editor => {
                if (this.generalIsFocused())
                    return atom.views.getView(editor).getModel();
                else
                    return this.main;
            });
        }
        if (this.connection.isAvailable()) {
            return this.connection.access().then(editor => {
                if (this.connectionIsFocused())
                    return atom.views.getView(editor).getModel();
                else
                    return this.main;
            });
        }
        else {
            return Promise.resolve(this.main);
        }
    }
    //
    answerGeneral(payload) {
        this.queryGeneralTP.resolve(payload);
    }
    rejectGeneral() {
        this.queryGeneralTP.reject(new error_1.QueryCancelled);
    }
    answerConnection(payload) {
        this.queryConnectionTP.resolve(payload);
    }
    rejectConnection() {
        this.queryConnectionTP.reject(new error_1.QueryCancelled);
    }
    queryGeneral() {
        return new Promise(this.queryGeneralTP.wire());
    }
    queryConnection() {
        return new Promise(this.queryConnectionTP.wire());
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
    isPending(isPending) {
        if (this.updateIsPending)
            this.updateIsPending({ isPending: isPending });
    }
    state() {
        return this.store.getState().view;
    }
    renderPanel(mountingPoint) {
        ReactDOM.render(React.createElement(View.EventContext.Provider, { value: this.emitter },
            React.createElement(View.CoreContext.Provider, { value: this.core },
                React.createElement(Panel, { updateHeader: handle => {
                        this.updateHeader = handle;
                    }, updateJSONBody: handle => {
                        this.updateJSONBody = handle;
                    }, updateEmacsBody: handle => {
                        this.updateEmacsBody = handle;
                    }, updateIsPending: handle => {
                        this.updateIsPending = handle;
                    }, 
                    // core={this.core}
                    // headerText={state.header.text}
                    // style={toStyle(state.header.style)}
                    // hidden={state.inputMethod.activated || _.isEmpty(state.header.text)}
                    // isPending={state.protocol.pending}
                    // mountAt={state.view.mountAt.current === V.MountingPosition.Bottom ? 'bottom' : 'pane'}
                    onMountChange: (at) => {
                        this.core.view.toggleDocking();
                        if (at === "bottom") {
                            this.store.dispatch(Action.VIEW.mountAtBottom());
                        }
                        else {
                            this.store.dispatch(Action.VIEW.mountAtPane());
                        }
                    }, 
                    // settingsViewOn={state.view.settingsView}
                    onSettingsViewToggle: (isActivated) => {
                        this.store.dispatch(Action.VIEW.toggleSettings());
                        if (isActivated) {
                            this.core.view.tabs.open('settings');
                        }
                        else {
                            this.core.view.tabs.close('settings');
                        }
                    } }))), mountingPoint);
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
    // for JSON
    setJSONError(rawJSON, rawString) {
        console.log(rawJSON);
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.updateHeader({
            text: errorToHeader(Reason.parseError(rawJSON)),
            style: 'error',
        });
        this.updateJSONBody({
            kind: 'Error',
            rawJSON: rawJSON,
            rawString: rawString
        });
    }
    setJSONAllGoalsWarnings(rawJSON, rawString) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.updateHeader({
            text: 'All Goals, Warnings, and Errors',
            style: 'info'
        });
        this.updateJSONBody({
            kind: 'AllGoalsWarnings',
            rawJSON: rawJSON,
            rawString: rawString,
        });
    }
    // for Emacs
    setEmacsPanel(header, kind, payload, style = "info") {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.updateHeader({
            text: header,
            style: style
        });
        this.updateEmacsBody({
            kind: kind,
            header: header,
            body: payload
        });
    }
    setEmacsGoalTypeContext(header = 'Judgements', goalTypeContext) {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.updateHeader({
            text: header,
            style: 'info'
        });
        this.updateEmacsBody({
            kind: 'GoalTypeContext',
            header: header,
            body: goalTypeContext
        });
    }
    setEmacsGoToDefinition(raw) {
        const result = parseWhyInScope(raw);
        if (result) {
            const [range, source] = result;
            this.core.editor.jumpToRange(range, source);
        }
    }
    setPlainText(header, body, style = "plain-text") {
        this.store.dispatch(Action.MODE.display());
        this.editors.focusMain();
        this.updateHeader({
            text: header,
            style: style,
        });
        this.updateEmacsBody({
            kind: 'PlainText',
            header: header,
            body: body
        });
    }
    query(header = '', _ = [], placeholder = '') {
        this.store.dispatch(Action.QUERY.setPlaceholder(placeholder));
        this.store.dispatch(Action.MODE.query());
        this.updateHeader({
            text: header,
            style: 'plain-text',
        });
        return this.editors.general.access()
            .then(editor => {
            if (!this.editors.generalIsFocused()) {
                let element = atom.views.getView(editor);
                element.focus();
                element.getModel().selectAll();
            }
            return this.editors.queryGeneral();
        });
    }
    queryConnection() {
        return this.tabs.open('settings').then(() => {
            this.store.dispatch(Action.VIEW.navigate({ path: '/Connection' }));
            return this.editors.connection.access()
                .then(editor => {
                if (!this.editors.connectionIsFocused()) {
                    let element = atom.views.getView(editor);
                    element.focus();
                    element.getModel().selectAll();
                }
                return this.editors.queryConnection();
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
View.CoreContext = React.createContext(undefined);
exports.default = View;
//# sourceMappingURL=view.js.map