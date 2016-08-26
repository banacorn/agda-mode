"use strict";
var React = require('react');
var ReactDOM = require('react-dom');
var react_redux_1 = require('react-redux');
var redux_1 = require('redux');
var App_1 = require("./view/App");
var store = redux_1.createStore(function (state, action) { return state; });
function mount() {
    ReactDOM.render(React.createElement(react_redux_1.Provider, {store: store}, 
        React.createElement(App_1.default, null)
    ), document.getElementById('agda-view'));
    return store;
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = mount;
//# sourceMappingURL=view-react.js.map