"use strict";
var _ = require('lodash');
var actions_1 = require('./actions');
var redux_actions_1 = require('redux-actions');
var defaultState = {
    inputMethodMode: false
};
var reducer = redux_actions_1.handleActions((_a = {},
    _a[actions_1.INPUT_METHOD.ACTIVATE] = function (state, action) { return _.assign({}, state, {
        inputMethodMode: true
    }); },
    _a[actions_1.INPUT_METHOD.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        inputMethodMode: false
    }); },
    _a
), defaultState);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = reducer;
var _a;
//# sourceMappingURL=reducers.js.map