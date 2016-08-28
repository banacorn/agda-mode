"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var InputMethod_1 = require("./view/InputMethod");
var reducers_1 = require('./view/reducers');
var store = redux_1.createStore(reducers_1.default);
function mount(core) {
    ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
        React.createElement(InputMethod_1.default, {updateTranslation: function (c) { return core.inputMethod.replaceBuffer(c); }, insertCharacter: function (c) {
            core.inputMethod.insertCharToBufffer(c);
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        }, chooseSymbol: function (c) {
            core.inputMethod.replaceBuffer(c);
            core.inputMethod.deactivate();
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        }})
    ), document.getElementById('agda-view'));
    return store;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mount;
//# sourceMappingURL=view.js.map