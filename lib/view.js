"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var InputMethod_1 = require("./view/InputMethod");
var reducers_1 = require('./view/reducers');
var store = redux_1.createStore(reducers_1.default);
function mount() {
    ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
        React.createElement(InputMethod_1.default, null)
    ), document.getElementById('agda-view'));
    return store;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mount;
//# sourceMappingURL=view.js.map