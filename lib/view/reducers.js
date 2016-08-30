"use strict";
var _ = require('lodash');
var events_1 = require('events');
var redux_1 = require('redux');
var redux_actions_1 = require('redux-actions');
var actions_1 = require('./actions');
var input_method_1 = require('../input-method');
// default state
var _a = input_method_1.translate(''), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
var defaultState = {
    header: {
        text: '',
        style: 0 /* PlainText */
    },
    inputMethod: {
        activated: false,
        buffer: '',
        translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols
    },
    inputEditor: {
        activated: false,
        focused: false,
        placeholder: '',
        emitter: new events_1.EventEmitter
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
var inputEditor = redux_actions_1.handleActions((_d = {},
    _d[actions_1.INPUT_EDITOR.ACTIVATE] = function (state, action) {
        return _.assign({}, state, {
            activated: true,
            placeholder: action.payload
        });
    },
    _d[actions_1.INPUT_EDITOR.DEACTIVATE] = function (state, action) {
        return _.assign({}, state, {
            activated: false
        });
    },
    _d[actions_1.INPUT_EDITOR.FOCUSED] = function (state, action) { return _.assign({}, state, {
        focused: true
    }); },
    _d[actions_1.INPUT_EDITOR.BLURRED] = function (state, action) { return _.assign({}, state, {
        focused: false
    }); },
    _d
), defaultState.inputEditor);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = redux_1.combineReducers({
    header: header,
    inputMethod: inputMethod,
    inputEditor: inputEditor
});
var _b, _c, _d;
//# sourceMappingURL=reducers.js.map