"use strict";
var _ = require('lodash');
var Promise = require('bluebird');
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var Panel_1 = require('./view/component/Panel');
var reducers_1 = require('./view/reducers');
var actions_1 = require("./view/actions");
var Action = require("./view/actions");
var parser_1 = require('./parser');
var actions_2 = require('./view/actions');
var actions_3 = require('./view/actions');
var CompositeDisposable = require('atom').CompositeDisposable;
var View = (function () {
    function View(core) {
        var _this = this;
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default);
        this.subscriptions = new CompositeDisposable;
        this.paneItemSubscriptions = new CompositeDisposable;
        this.paneItemDestroyedByAtom = true;
        this.uri = "agda-mode://" + this.core.editor.id;
        // global events
        var emitter = this.store.getState().emitter;
        emitter.on(actions_1.EVENT.JUMP_TO_GOAL, function (index) {
            _this.core.textBuffer.jumpToGoal(index);
        });
        emitter.on(actions_1.EVENT.JUMP_TO_LOCATION, function (loc) {
            _this.core.textBuffer.jumpToLocation(loc);
        });
        this.subscriptions.add(atom.workspace.addOpener(function (uri) {
            var _a = _this.parseURI(uri), protocol = _a.protocol, path = _a.path;
            var openedByAgdaMode = protocol === 'agda-mode';
            var openedByTheSameEditor = path === _this.core.editor.id.toString();
            if (openedByAgdaMode && openedByTheSameEditor) {
                return _this.createEditor(path);
            }
        }));
    }
    View.prototype.parseURI = function (uri) {
        var _a = uri.split('://'), protocol = _a[0], path = _a[1];
        return {
            protocol: protocol,
            path: path
        };
    };
    View.prototype.ownedPaneItem = function (item) {
        return false;
    };
    View.prototype.state = function () {
        return this.store.getState().view;
    };
    View.prototype.createEditor = function (path) {
        var _this = this;
        var editor = document.createElement('article');
        editor.classList.add('agda-view');
        editor['getURI'] = function () {
            var uri = _this.uri;
            return uri;
        };
        editor['getTitle'] = function () { return ("Agda Mode " + path); };
        editor.id = this.uri;
        return editor;
    };
    View.prototype.render = function () {
        var _this = this;
        if (this.mountingPosition === null) {
            console.error("this.mountingPosition === null");
        }
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: this.store}, 
            React.createElement(Panel_1.default, {core: this.core, onMiniEditorMount: function (editor) {
                _this.miniEditor = editor;
            }, mountAtPane: function () {
                _this.unmount(_this.state().mountAt.previous);
                _this.mount(_this.state().mountAt.current);
            }, mountAtBottom: function () {
                _this.unmount(_this.state().mountAt.previous);
                _this.mount(_this.state().mountAt.current);
                // console.log(`[${this.uri.substr(12)}] %cstate of activation: ${this.state().activated}`, 'color: cyan')
            }})
        ), this.mountingPosition);
    };
    View.prototype.mount = function (mountAt) {
        var _this = this;
        if (!this.state().mounted) {
            // console.log(`[${this.uri.substr(12)}] %cmount at ${toText(mountAt)}`, 'color: green')
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
                    var uri = this.uri;
                    var previousActivePane_1 = atom.workspace.getActivePane();
                    atom.workspace.open(uri, {
                        searchAllPanes: true,
                        split: 'right'
                    }).then(function (view) {
                        // mounting position
                        _this.mountingPosition = view;
                        previousActivePane_1.activate();
                        // on destroy
                        var pane = atom.workspace.paneForItem(_this.mountingPosition);
                        if (pane) {
                            _this.paneItemSubscriptions.add(pane.onWillDestroyItem(function (event) {
                                if (event.item.getURI() === _this.uri) {
                                    // console.log(`[${this.uri.substr(12)}] %cpane item destroyed by ${this.paneItemDestroyedByAtom ? `Atom` : 'agda-mode'}`, 'color: red');
                                    if (_this.paneItemDestroyedByAtom) {
                                        _this.store.dispatch(Action.mountAtBottom());
                                        _this.unmountPrim(0 /* Pane */);
                                        _this.mount(1 /* Bottom */);
                                    }
                                    else {
                                        _this.paneItemDestroyedByAtom = true;
                                    }
                                }
                            }));
                        }
                        // render
                        _this.render();
                    });
                    break;
                default:
                    console.error('no mounting position to transist to');
            }
        }
    };
    View.prototype.unmount = function (mountAt) {
        switch (mountAt) {
            case 1 /* Bottom */:
                // do nothing
                break;
            case 0 /* Pane */:
                this.paneItemDestroyedByAtom = false;
                break;
            default:
                // do nothing
                break;
        }
        this.unmountPrim(mountAt);
    };
    View.prototype.unmountPrim = function (mountAt) {
        if (this.state().mounted) {
            // console.log(`[${this.uri.substr(12)}] %cunmount at ${toText(mountAt)}`, 'color: orange')
            // Redux
            this.store.dispatch(Action.unmountView());
            switch (mountAt) {
                case 1 /* Bottom */:
                    // mounting position
                    this.bottomPanel.destroy();
                    break;
                case 0 /* Pane */:
                    // destroy the editor, but don't bother if it's already destroyed by Atom
                    if (!this.paneItemDestroyedByAtom) {
                        var pane = atom.workspace.paneForItem(this.mountingPosition);
                        if (pane) {
                            pane.destroyItem(this.mountingPosition);
                            // unsubscribe
                            this.paneItemSubscriptions.dispose();
                        }
                    }
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
    };
    View.prototype.activate = function () {
        // console.log(`[${this.uri.substr(12)}] %cactivated`, 'color: blue')
        this.store.dispatch(actions_2.activateView());
        switch (this.state().mountAt.current) {
            case 1 /* Bottom */:
                // do nothing
                break;
            case 0 /* Pane */:
                var pane = atom.workspace.paneForItem(this.mountingPosition);
                if (pane)
                    pane.activateItem(this.mountingPosition);
                break;
            default:
                // do nothing
                break;
        }
    };
    View.prototype.deactivate = function () {
        // console.log(`[${this.uri.substr(12)}] %cdeactivated`, 'color: purple')
        this.store.dispatch(actions_2.deactivateView());
    };
    // destructor
    View.prototype.destroy = function () {
        // console.log(`[${this.uri.substr(12)}] %cdestroy`, 'color: red');
        this.unmount(this.state().mountAt.current);
        this.subscriptions.dispose();
    };
    View.prototype.set = function (header, payload, type) {
        if (type === void 0) { type = 0 /* PlainText */; }
        this.store.dispatch(actions_3.updateHeader({
            text: header,
            style: type
        }));
        if (type === 1 /* Info */ || type === 2 /* Success */) {
            var _a = parser_1.parseContent(payload), banner = _a.banner, body = _a.body;
            var grouped = _.groupBy(body, 'judgementForm');
            this.store.dispatch(actions_3.updateBanner(banner));
            this.store.dispatch(actions_3.updateBody({
                goal: (grouped['goal'] || []),
                judgement: (grouped['type judgement'] || []),
                term: (grouped['term'] || []),
                meta: (grouped['meta'] || []),
                sort: (grouped['sort'] || [])
            }));
        }
        else if (type === 3 /* Error */) {
            var error = parser_1.parseError(payload.join('\n'));
            this.store.dispatch(actions_3.updateError(error));
            if (error) {
                this.store.dispatch(actions_3.updateHeader({
                    style: 3 /* Error */,
                    text: error.header
                }));
            }
        }
        else {
            this.store.dispatch(actions_3.updatePlainText(payload.join('\n')));
        }
    };
    View.prototype.query = function (header, message, type, placeholder, inputMethodOn) {
        if (header === void 0) { header = ''; }
        if (message === void 0) { message = []; }
        if (type === void 0) { type = 0 /* PlainText */; }
        if (placeholder === void 0) { placeholder = ''; }
        if (inputMethodOn === void 0) { inputMethodOn = true; }
        this.store.dispatch(actions_2.enableInMiniEditor(inputMethodOn));
        this.store.dispatch(actions_3.activateMiniEditor(placeholder));
        this.store.dispatch(actions_3.updateHeader({
            text: header,
            style: type
        }));
        this.miniEditor.activate();
        return this.miniEditor.query();
    };
    View.prototype.toggleDocking = function () {
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
        return Promise.resolve({ status: 'Issued', command: 'ToggleDocking' });
    };
    return View;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
function toText(mp) {
    switch (mp) {
        case 1 /* Bottom */:
            return 'Bottom;';
        case 0 /* Pane */:
            return 'Pane';
        default:
            return '';
    }
}
//# sourceMappingURL=view.js.map