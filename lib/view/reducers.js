"use strict";
var _ = require('lodash');
var actions_1 = require('./actions');
var redux_1 = require('redux');
var redux_actions_1 = require('redux-actions');
var input_method_1 = require('../input-method');
var _a = input_method_1.translate(''), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
var defaultState = {
    header: {
        text: '',
        style: 0
    },
    inputMethod: {
        activated: false,
        buffer: '',
        translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols
    }
};
var inputMethod = redux_actions_1.handleActions((_b = {},
    _b[actions_1.INPUT_METHOD.ACTIVATE] = function (state, action) {
        var _a = input_method_1.translate(''), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
        return _.assign({}, state, {
            activated: true,
            buffer: '',
            translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols
        });
    },
    _b[actions_1.INPUT_METHOD.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        activated: false
    }); },
    _b[actions_1.INPUT_METHOD.INSERT] = function (state, action) {
        var buffer = state.buffer + action.payload;
        var _a = input_method_1.translate(buffer), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
        return _.assign({}, state, { buffer: buffer, translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols });
    },
    _b[actions_1.INPUT_METHOD.DELETE] = function (state, action) {
        var buffer = state.buffer.substring(0, state.buffer.length - 1);
        var _a = input_method_1.translate(buffer), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
        return _.assign({}, state, { buffer: buffer, translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols });
    },
    _b
), defaultState.inputMethod);
var header = redux_actions_1.handleActions((_c = {},
    _c[actions_1.HEADER.UPDATE] = function (state, action) { return action.payload; },
    _c
), defaultState.header);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = redux_1.combineReducers({
    inputMethod: inputMethod,
    header: header
});
var _b, _c;
//# sourceMappingURL=reducers.js.map