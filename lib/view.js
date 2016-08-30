"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var Panel_1 = require('./view/Panel');
var reducers_1 = require('./view/reducers');
var actions_1 = require('./view/actions');
var store = redux_1.createStore(reducers_1.default);
var View = (function () {
    function View(core) {
        this.core = core;
        this.store = store;
    }
    View.prototype.mount = function () {
        var _this = this;
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
            React.createElement(Panel_1.default, {core: this.core, onMiniEditorMount: function (editor) {
                _this.miniEditor = editor;
            }})
        ), document.getElementById('agda-view'));
    };
    View.prototype.set = function (header, body, type) {
        if (type === void 0) { type = 0 /* PlainText */; }
        this.store.dispatch(actions_1.updateHeader({
            text: header,
            style: type
        }));
    };
    View.prototype.query = function (header, message, type, placeholder) {
        this.store.dispatch(actions_1.activateMiniEditor());
        this.store.dispatch(actions_1.updateHeader({
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