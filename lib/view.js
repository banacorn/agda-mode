"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
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
const pane_item_1 = require("./view/pane-item");
const util_1 = require("./util");
var { CompositeDisposable } = require('atom');
class View {
    constructor(core) {
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default, redux_1.applyMiddleware(redux_thunk_1.default));
        this.emitter = new events_1.EventEmitter;
        this.subscriptions = new CompositeDisposable;
        this.editor = core.editor;
        // global events
        this.emitter.on(actions_1.EVENT.JUMP_TO_GOAL, (index) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        this.emitter.on(actions_1.EVENT.JUMP_TO_LOCATION, (loc) => {
            this.core.textBuffer.jumpToLocation(loc);
        });
        // TelePromises
        this.connectionInquisitorTP = new util_1.TelePromise;
        // view pane item
        this.viewPaneItem = new pane_item_1.default(this.editor, 'view');
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
                this.unmount(0 /* Pane */);
                this.mount(1 /* Bottom */);
            }
        });
        // initialize settings view
        this.settingsViewPaneItem = new pane_item_1.default(this.editor, 'settings', () => {
            const { name } = path.parse(this.editor.getPath());
            return `[Settings] ${name}`;
        });
        this.settingsViewPaneItem.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            this.settingsViewElement = paneItem;
            this.renderSettingsView();
        });
        this.settingsViewPaneItem.onClose((paneItem, closedDeliberately) => {
            if (closedDeliberately === false) {
                this.store.dispatch(Action.VIEW.toggleSettings());
            }
        });
    }
    state() {
        return this.store.getState().view;
    }
    render() {
        if (this.mountingPosition === null) {
            console.error(`this.mountingPosition === null`);
        }
        ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
            React.createElement(Panel_1.default, { core: this.core, emitter: this.emitter })), this.mountingPosition);
    }
    renderSettingsView() {
        if (this.settingsViewElement === null) {
            console.error(`this.settingsViewElement === null`);
        }
        ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
            React.createElement(Settings_1.default, { core: this.core })), this.settingsViewElement);
    }
    getEditor() {
        return this.editor;
    }
    getFocusedEditor() {
        const miniEditorFocused = this.miniEditor && this.miniEditor.isFocused();
        if (miniEditorFocused)
            return this.miniEditor.getModel();
        else
            return this.editor;
    }
    mount(mountAt) {
        if (!this.state().mounted) {
            // console.log(`[${this.editor.id}] %cmount at ${toText(mountAt)}`, 'color: green')
            // Redux
            this.store.dispatch(Action.VIEW.mount());
            switch (mountAt) {
                case 1 /* Bottom */:
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
                case 0 /* Pane */:
                    this.viewPaneItem.open();
                    break;
                default:
                    console.error('no mounting position to transist to');
            }
        }
    }
    unmount(mountAt) {
        if (this.state().mounted) {
            // console.log(`[${this.editor.id}] %cunmount at ${toText(mountAt)}`, 'color: orange')
            // Redux
            this.store.dispatch(Action.VIEW.unmount());
            switch (mountAt) {
                case 1 /* Bottom */:
                    this.bottomPanel.destroy();
                    break;
                case 0 /* Pane */:
                    this.viewPaneItem.close();
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
        });
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                // do nothing
                break;
            case 0 /* Pane */:
                this.viewPaneItem.activate();
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
    set(header, payload, type = 0 /* PlainText */) {
        this.store.dispatch(Action.MODE.display());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.store.dispatch(actions_2.updatePlainText(payload.join('\n')));
    }
    setError(error) {
        this.store.dispatch(Action.MODE.display());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(Action.HEADER.update({
            text: 'Error',
            style: 3 /* Error */
        }));
        this.store.dispatch(actions_2.updateError(error));
        if (error) {
            this.store.dispatch(Action.HEADER.update({
                style: 3 /* Error */,
                text: error.header
            }));
        }
    }
    setJudgements(header = 'Judgements', { banner, body }) {
        this.store.dispatch(Action.MODE.display());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: 1 /* Info */
        }));
        this.store.dispatch(actions_2.updateBanner(banner));
        const grouped = _.groupBy(body, 'judgementForm');
        this.store.dispatch(actions_2.updateBody({
            goal: (grouped['goal'] || []),
            judgement: (grouped['type judgement'] || []),
            term: (grouped['term'] || []),
            meta: (grouped['meta'] || []),
            sort: (grouped['sort'] || [])
        }));
    }
    query(header = '', message = [], type = 0 /* PlainText */, placeholder = '', inputMethodOn = true) {
        this.store.dispatch(Action.INPUT_METHOD.enableInMiniEditor(inputMethodOn));
        this.store.dispatch(Action.MODE.query());
        this.store.dispatch(Action.HEADER.update({
            text: header,
            style: type
        }));
        this.miniEditor.activate(placeholder);
        return this.miniEditor.query();
    }
    inquireConnection() {
        // update the view
        this.store.dispatch(Action.MODE.inquireConnection());
        this.store.dispatch(Action.HEADER.update({
            text: "Oh no!!",
            style: 4 /* Warning */
        }));
        // return a promise that get resolved when when the query is complete
        return new Promise(this.connectionInquisitorTP.wire());
    }
    toggleDocking() {
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                this.store.dispatch(Action.VIEW.mountAtPane());
                this.unmount(1 /* Bottom */);
                this.mount(0 /* Pane */);
                break;
            case 0 /* Pane */:
                this.store.dispatch(Action.VIEW.mountAtBottom());
                this.unmount(0 /* Pane */);
                this.mount(1 /* Bottom */);
                break;
            default:
                // do nothing
                break;
        }
        return Promise.resolve({});
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