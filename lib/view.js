"use strict";
const _ = require("lodash");
const Promise = require("bluebird");
const React = require("react");
const ReactDOM = require("react-dom");
const path = require("path");
const react_redux_1 = require("react-redux");
const redux_1 = require("redux");
const events_1 = require("events");
const Panel_1 = require("./view/component/Panel");
const Dev_1 = require("./view/component/Dev");
const reducers_1 = require("./view/reducers");
const actions_1 = require("./view/actions");
const Action = require("./view/actions");
const actions_2 = require("./view/actions");
const pane_item_1 = require("./view/pane-item");
var { CompositeDisposable } = require('atom');
class View {
    constructor(core) {
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default);
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
                this.store.dispatch(Action.mountAtBottom());
                this.unmount(0 /* Pane */);
                this.mount(1 /* Bottom */);
            }
        });
        // initialize dev view
        this.devViewPaneItem = new pane_item_1.default(this.editor, 'dev', () => {
            const { name } = path.parse(this.editor.getPath());
            return `[Dev] ${name}`;
        });
        this.devViewPaneItem.onOpen((paneItem, panes) => {
            // activate the previous pane (which opened this pane item)
            panes.previous.activate();
            this.devViewElement = paneItem;
            this.renderDevView();
        });
        this.devViewPaneItem.onClose((paneItem, closedDeliberately) => {
            // console.log(`dev view closed (deliberately: ${closedDeliberately})`)
            if (closedDeliberately === false) {
                this.store.dispatch(Action.toggleDevView());
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
            React.createElement(Panel_1.default, { core: this.core, emitter: this.emitter, onMiniEditorMount: (editor) => {
                    this.miniEditor = editor;
                }, toggleDevView: () => {
                    const activated = this.store.getState().view.devView;
                    if (activated)
                        this.devViewPaneItem.open();
                    else
                        this.devViewPaneItem.close();
                }, mountAtPane: () => {
                    this.unmount(this.state().mountAt.previous);
                    this.mount(this.state().mountAt.current);
                }, mountAtBottom: () => {
                    this.unmount(this.state().mountAt.previous);
                    this.mount(this.state().mountAt.current);
                    // console.log(`[${this.uri.substr(12)}] %cstate of activation: ${this.state().activated}`, 'color: cyan')
                } })), this.mountingPosition);
    }
    renderDevView() {
        if (this.devViewElement === null) {
            console.error(`this.devViewElement === null`);
        }
        ReactDOM.render(React.createElement(react_redux_1.Provider, { store: this.store },
            React.createElement(Dev_1.default, null)), this.devViewElement);
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
            this.store.dispatch(Action.mountView());
            switch (mountAt) {
                case 1 /* Bottom */:
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
            this.store.dispatch(Action.unmountView());
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
            this.store.dispatch(Action.activateView());
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
        this.store.dispatch(Action.deactivateView());
    }
    // destructor
    destroy() {
        // console.log(`[${this.uri.substr(12)}] %cdestroy`, 'color: red');
        this.unmount(this.state().mountAt.current);
        this.subscriptions.dispose();
        this.viewPaneItem.destroy();
    }
    set(header, payload, type = 0 /* PlainText */) {
        this.store.dispatch(Action.deactivateMiniEditor());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(actions_2.updateHeader({
            text: header,
            style: type
        }));
        this.store.dispatch(actions_2.updatePlainText(payload.join('\n')));
    }
    setError(error) {
        this.store.dispatch(Action.deactivateMiniEditor());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(actions_2.updateHeader({
            text: 'Error',
            style: 3 /* Error */
        }));
        this.store.dispatch(actions_2.updateError(error));
        if (error) {
            this.store.dispatch(actions_2.updateHeader({
                style: 3 /* Error */,
                text: error.header
            }));
        }
    }
    setJudgements(header = 'Judgements', { banner, body }) {
        this.store.dispatch(Action.deactivateMiniEditor());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(actions_2.updateHeader({
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
        this.store.dispatch(Action.enableInMiniEditor(inputMethodOn));
        this.store.dispatch(actions_2.activateMiniEditor(placeholder));
        this.store.dispatch(actions_2.updateHeader({
            text: header,
            style: type
        }));
        this.miniEditor.activate();
        return this.miniEditor.query();
    }
    toggleDocking() {
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                this.store.dispatch(Action.mountAtPane());
                this.unmount(1 /* Bottom */);
                this.mount(0 /* Pane */);
                break;
            case 0 /* Pane */:
                this.store.dispatch(Action.mountAtBottom());
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
Object.defineProperty(exports, "__esModule", { value: true });
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