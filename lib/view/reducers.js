"use strict";
var _ = require('lodash');
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
    miniEditor: {
        activate: false,
        placeholder: ''
    },
    body: {
        banner: [],
        body: {
            goal: [],
            judgement: [],
            term: [],
            meta: [],
            sort: []
        },
        error: null,
        plainText: ''
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
var miniEditor = redux_actions_1.handleActions((_d = {},
    _d[actions_1.MINI_EDITOR.ACTIVATE] = function (state, action) { return _.assign({}, state, {
        activate: true,
        placeholder: action.payload
    }); },
    _d[actions_1.MINI_EDITOR.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        activate: false
    }); },
    _d
), defaultState.miniEditor);
var body = redux_actions_1.handleActions((_e = {},
    _e[actions_1.BODY.UPDATE_BANNER] = function (state, action) { return _.assign({}, state, {
        banner: action.payload
    }); },
    _e[actions_1.BODY.UPDATE_BODY] = function (state, action) { return _.assign({}, state, {
        body: action.payload
    }); },
    _e[actions_1.BODY.UPDATE_ERROR] = function (state, action) { return _.assign({}, state, {
        error: action.payload
    }); },
    _e[actions_1.BODY.UPDATE_PLAIN_TEXT] = function (state, action) { return _.assign({}, state, {
        plainText: action.payload
    }); },
    _e
), defaultState.body);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = redux_1.combineReducers({
    header: header,
    inputMethod: inputMethod,
    miniEditor: miniEditor,
    body: body
});
var _b, _c, _d, _e;
//# sourceMappingURL=reducers.js.map