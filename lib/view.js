"use strict";
var _ = require('lodash');
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
var View = (function () {
    function View(core) {
        var _this = this;
        this.core = core;
        this.store = redux_1.createStore(reducers_1.default);
        // global events
        var emitter = this.store.getState().emitter;
        emitter.on(actions_1.EVENT.JUMP_TO_GOAL, function (index) {
            _this.core.textBuffer.jumpToGoal(index);
        });
        emitter.on(actions_1.EVENT.JUMP_TO_LOCATION, function (loc) {
            _this.core.textBuffer.jumpToLocation(loc);
        });
        // this.mount();
    }
    View.prototype.state = function () {
        return this.store.getState().view;
    };
    View.prototype.render = function () {
        var _this = this;
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: this.store}, 
            React.createElement(Panel_1.default, {core: this.core, onMiniEditorMount: function (editor) {
                _this.miniEditor = editor;
            }})
        ), this.mountingPoint);
    };
    View.prototype.mount = function () {
        if (!this.state().mounted) {
            console.log('mount');
            // Redux
            this.store.dispatch(Action.mountView());
            // mounting point
            this.mountingPoint = document.createElement('article');
            this.bottomPanel = atom.workspace.addBottomPanel({
                item: this.mountingPoint,
                visible: true,
                className: 'agda-view'
            });
            // render
            this.render();
        }
    };
    View.prototype.unmount = function () {
        if (this.state().mounted) {
            console.log('unmount');
            // Redux
            this.store.dispatch(Action.unmountView());
            // React
            ReactDOM.unmountComponentAtNode(this.mountingPoint);
            // mounting point
            this.mountingPoint = null;
        }
    };
    View.prototype.activate = function () {
        this.store.dispatch(actions_2.activateView());
    };
    View.prototype.deactivate = function () {
        this.store.dispatch(actions_2.deactivateView());
    };
    // destructor
    View.prototype.destroy = function () {
        this.bottomPanel.destroy();
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
    return View;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
//# sourceMappingURL=view.js.map