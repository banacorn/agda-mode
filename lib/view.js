"use strict";
var Promise = require('bluebird');
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var Panel_1 = require('./view/Panel');
var reducers_1 = require('./view/reducers');
var actions_1 = require('./view/actions');
var error_1 = require('./error');
var store = redux_1.createStore(reducers_1.default);
var View = (function () {
    function View(core) {
        this.core = core;
        this.store = store;
    }
    View.prototype.mount = function () {
        ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
            React.createElement(Panel_1.default, {core: this.core})
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
        var _this = this;
        this.store.dispatch(actions_1.activateInputEditor(placeholder));
        this.store.dispatch(actions_1.updateHeader({
            text: header,
            style: type
        }));
        var emitter = this.store.getState().inputEditor.emitter;
        return new Promise(function (resolve, reject) {
            emitter.once('confirm', function (payload) {
                _this.store.dispatch(actions_1.deactivateInputEditor());
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                resolve(payload);
            });
            emitter.once('cancel', function () {
                _this.store.dispatch(actions_1.deactivateInputEditor());
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                reject(new error_1.QueryCancelledError(''));
            });
        });
        // this.header = header;
        // this.content = {
        //     body: message,
        //     type: type,
        //     placeholder: placeholder
        // };
        // this.headerStyle = toHeaderStyle(type);
        // // show input box, as it would had been hidden when initialized
        //
        // const promise = this.$refs.inputEditor.query(enableIM, placeholder);
        //
        // // hide input editor and give focus back
        // this.$once("input-editor:confirm", () => {
        //     this.queryMode = false;
        //     atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        // });
        // this.$once("input-editor:cancel", () => {
        //     this.queryMode = false;
        //     atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        // });
        //
        // this.queryMode = true;
        // return promise;
    };
    return View;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = View;
//# sourceMappingURL=view.js.map