"use strict";
var _ = require('lodash');
var actions_1 = require('./actions');
var redux_1 = require('redux');
var redux_actions_1 = require('redux-actions');
var defaultState = {
    inputMethod: {
        activate: false,
        buffer: ""
    }
};
var inputMethod = redux_actions_1.handleActions((_a = {},
    _a[actions_1.INPUT_METHOD.ACTIVATE] = function (state, action) { return _.assign({}, state, {
        activate: true
    }); },
    _a[actions_1.INPUT_METHOD.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        activate: false
    }); },
    _a
), defaultState.inputMethod);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = redux_1.combineReducers({
    inputMethod: inputMethod,
});
var _a;
//# sourceMappingURL=reducers.js.map