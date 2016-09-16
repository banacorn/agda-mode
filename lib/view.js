"use strict";
var _ = require('lodash');
var Promise = require('bluebird');
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var events_1 = require('events');
var path_1 = require('path');
var Panel_1 = require('./view/component/Panel');
var reducers_1 = require('./view/reducers');
var actions_1 = require("./view/actions");
var Action = require("./view/actions");
var parser_1 = require('./parser');
var actions_2 = require('./view/actions');
var CompositeDisposable = require('atom').CompositeDisposable;
var View = (function () {
    function View(core) {
        var _this = this;
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default);
        this.emitter = new events_1.EventEmitter;
        this.subscriptions = new CompositeDisposable;
        this.paneItemSubscriptions = new CompositeDisposable;
        this.paneItemDestroyedByAtom = true;
        this.editor = core.editor;
        this.uri = "agda-mode://" + this.core.editor.id;
        this.emitter.on(actions_1.EVENT.JUMP_TO_GOAL, function (index) {
            _this.core.textBuffer.jumpToGoal(index);
        });
        this.emitter.on(actions_1.EVENT.JUMP_TO_LOCATION, function (loc) {
            _this.core.textBuffer.jumpToLocation(loc);
        });
        this.subscriptions.add(atom.workspace.addOpener(function (uri) {
            var _a = _this.parseURI(uri), protocol = _a.protocol, path = _a.path;
            var openedByAgdaMode = protocol === 'agda-mode';
            var openedByTheSameEditor = path === _this.core.editor.id.toString();
            if (openedByAgdaMode && openedByTheSameEditor) {
                return _this.createPaneItem(path);
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
    View.prototype.createPaneItem = function (path) {
        var _this = this;
        var paneItem = document.createElement('article');
        paneItem.classList.add('agda-view');
        paneItem['getURI'] = function () { return _this.uri; };
        var base = path_1.basename(this.editor.getPath());
        var ext = path_1.extname(base);
        var title = "[Agda Mode] " + base.substr(0, base.length - ext.length);
        paneItem['getTitle'] = function () { return title; };
        paneItem['getEditor'] = function () { return _this.editor; };
        paneItem.id = this.uri;
        return paneItem;
    };
    View.prototype.render = function () {
        var _this = this;
        if (this.mountingPosition === null) {
            console.error("this.mountingPosition === null");
        }
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: this.store}, 
            React.createElement(Panel_1.default, {core: this.core, emitter: this.emitter, onMiniEditorMount: function (editor) {
                _this.miniEditor = editor;
            }, mountAtPane: function () {
                _this.unmount(_this.state().mountAt.previous);
                _this.mount(_this.state().mountAt.current);
            }, mountAtBottom: function () {
                _this.unmount(_this.state().mountAt.previous);
                _this.mount(_this.state().mountAt.current);
            }})
        ), this.mountingPosition);
    };
    View.prototype.getEditor = function () {
        return this.editor;
    };
    View.prototype.getFocusedEditor = function () {
        var miniEditorFocused = this.miniEditor && this.miniEditor.isFocused();
        if (miniEditorFocused)
            return this.miniEditor.getModel();
        else
            return this.editor;
    };
    View.prototype.mount = function (mountAt) {
        var _this = this;
        if (!this.state().mounted) {
            this.store.dispatch(Action.mountView());
            switch (mountAt) {
                case 1:
                    this.mountingPosition = document.createElement('article');
                    this.bottomPanel = atom.workspace.addBottomPanel({
                        item: this.mountingPosition,
                        visible: true,
                        className: 'agda-view'
                    });
                    this.render();
                    break;
                case 0:
                    var uri = this.uri;
                    var previousActivePane_1 = atom.workspace.getActivePane();
                    atom.workspace.open(uri, {
                        searchAllPanes: true,
                        split: 'right'
                    }).then(function (view) {
                        _this.mountingPosition = view;
                        previousActivePane_1.activate();
                        var pane = atom.workspace.paneForItem(_this.mountingPosition);
                        if (pane) {
                            _this.paneItemSubscriptions.add(pane.onWillDestroyItem(function (event) {
                                if (event.item.getURI() === _this.uri) {
                                    if (_this.paneItemDestroyedByAtom) {
                                        _this.store.dispatch(Action.mountAtBottom());
                                        _this.unmountPrim(0);
                                        _this.mount(1);
                                    }
                                    else {
                                        _this.paneItemDestroyedByAtom = true;
                                    }
                                }
                            }));
                        }
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
            case 1:
                break;
            case 0:
                this.paneItemDestroyedByAtom = false;
                break;
            default:
                break;
        }
        this.unmountPrim(mountAt);
    };
    View.prototype.unmountPrim = function (mountAt) {
        if (this.state().mounted) {
            this.store.dispatch(Action.unmountView());
            switch (mountAt) {
                case 1:
                    this.bottomPanel.destroy();
                    break;
                case 0:
                    if (!this.paneItemDestroyedByAtom) {
                        var pane = atom.workspace.paneForItem(this.mountingPosition);
                        if (pane) {
                            pane.destroyItem(this.mountingPosition);
                            this.paneItemSubscriptions.dispose();
                        }
                    }
                    break;
                default:
                    break;
            }
            ReactDOM.unmountComponentAtNode(this.mountingPosition);
            this.mountingPosition = null;
        }
    };
    View.prototype.activate = function () {
        var _this = this;
        setTimeout(function () {
            _this.store.dispatch(Action.activateView());
        });
        switch (this.state().mountAt.current) {
            case 1:
                break;
            case 0:
                var pane = atom.workspace.paneForItem(this.mountingPosition);
                if (pane)
                    pane.activateItem(this.mountingPosition);
                break;
            default:
                break;
        }
    };
    View.prototype.deactivate = function () {
        this.store.dispatch(Action.deactivateView());
    };
    View.prototype.destroy = function () {
        this.unmount(this.state().mountAt.current);
        this.subscriptions.dispose();
    };
    View.prototype.set = function (header, payload, type) {
        if (type === void 0) { type = 0; }
        this.store.dispatch(Action.deactivateMiniEditor());
        atom.views.getView(this.getEditor()).focus();
        this.store.dispatch(actions_2.updateHeader({
            text: header,
            style: type
        }));
        if (type === 1 || type === 2) {
            var _a = parser_1.parseContent(payload), banner = _a.banner, body = _a.body;
            var grouped = _.groupBy(body, 'judgementForm');
            this.store.dispatch(actions_2.updateBanner(banner));
            this.store.dispatch(actions_2.updateBody({
                goal: (grouped['goal'] || []),
                judgement: (grouped['type judgement'] || []),
                term: (grouped['term'] || []),
                meta: (grouped['meta'] || []),
                sort: (grouped['sort'] || [])
            }));
        }
        else if (type === 3) {
            var error = parser_1.parseError(payload.join('\n'));
            this.store.dispatch(actions_2.updateError(error));
            if (error) {
                this.store.dispatch(actions_2.updateHeader({
                    style: 3,
                    text: error.header
                }));
            }
        }
        else {
            this.store.dispatch(actions_2.updatePlainText(payload.join('\n')));
        }
    };
    View.prototype.query = function (header, message, type, placeholder, inputMethodOn) {
        if (header === void 0) { header = ''; }
        if (message === void 0) { message = []; }
        if (type === void 0) { type = 0; }
        if (placeholder === void 0) { placeholder = ''; }
        if (inputMethodOn === void 0) { inputMethodOn = true; }
        this.store.dispatch(Action.enableInMiniEditor(inputMethodOn));
        this.store.dispatch(actions_2.activateMiniEditor(placeholder));
        this.store.dispatch(actions_2.updateHeader({
            text: header,
            style: type
        }));
        this.miniEditor.activate();
        return this.miniEditor.query();
    };
    View.prototype.toggleDocking = function () {
        switch (this.state().mountAt.current) {
            case 1:
                this.store.dispatch(Action.mountAtPane());
                this.unmount(1);
                this.mount(0);
                break;
            case 0:
                this.store.dispatch(Action.mountAtBottom());
                this.unmount(0);
                this.mount(1);
                break;
            default:
                break;
        }
        return Promise.resolve({});
    };
    return View;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
function toText(mp) {
    switch (mp) {
        case 1:
            return 'Bottom;';
        case 0:
            return 'Pane';
        default:
            return '';
    }
}
//# sourceMappingURL=view.js.map