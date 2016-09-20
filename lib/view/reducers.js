"use strict";
var _ = require('lodash');
var redux_1 = require('redux');
var redux_actions_1 = require('redux-actions');
var actions_1 = require('./actions');
var input_method_1 = require('../input-method');
// default state
var _a = input_method_1.translate(''), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
var defaultState = {
    view: {
        activated: false,
        mounted: false,
        mountAt: {
            previous: null,
            current: 1 /* Bottom */
        },
        devView: false
    },
    dev: {
        messages: []
    },
    header: {
        text: '',
        style: 0 /* PlainText */
    },
    inputMethod: {
        enableInMiniEditor: true,
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
        plainText: '',
        maxBodyHeight: 170
    }
};
var view = redux_actions_1.handleActions((_b = {},
    _b[actions_1.VIEW.ACTIVATE] = function (state, action) { return _.assign({}, state, {
        activated: true
    }); },
    _b[actions_1.VIEW.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        activated: false
    }); },
    _b[actions_1.VIEW.MOUNT] = function (state, action) { return _.assign({}, state, {
        mounted: true
    }); },
    _b[actions_1.VIEW.UNMOUNT] = function (state, action) { return _.assign({}, state, {
        mounted: false
    }); },
    _b[actions_1.VIEW.MOUNT_AT_PANE] = function (state, action) { return _.assign({}, state, {
        mountAt: {
            previous: state.mountAt.current,
            current: 0 /* Pane */
        }
    }); },
    _b[actions_1.VIEW.MOUNT_AT_BOTTOM] = function (state, action) { return _.assign({}, state, {
        mountAt: {
            previous: state.mountAt.current,
            current: 1 /* Bottom */
        }
    }); },
    _b[actions_1.VIEW.TOGGLE_DEV_VIEW] = function (state, action) { return _.assign({}, state, {
        devView: !state.devView
    }); },
    _b
), defaultState.view);
var dev = redux_actions_1.handleActions((_c = {},
    _c[actions_1.DEV.REQUEST] = function (state, action) { return _.assign({}, state, {
        messages: _.concat(state.messages, [{
                kind: 'request',
                message: action.payload
            }])
    }); },
    _c[actions_1.DEV.RESPONSE] = function (state, action) { return _.assign({}, state, {
        messages: _.concat(state.messages, [{
                kind: 'response',
                message: action.payload
            }])
    }); },
    _c
), defaultState.dev);
var inputMethod = redux_actions_1.handleActions((_d = {},
    _d[actions_1.INPUT_METHOD.ACTIVATE] = function (state, action) {
        var _a = input_method_1.translate(''), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
        return _.assign({}, state, {
            activated: true,
            buffer: '',
            translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols
        });
    },
    _d[actions_1.INPUT_METHOD.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        activated: false
    }); },
    _d[actions_1.INPUT_METHOD.INSERT] = function (state, action) {
        var buffer = state.buffer + action.payload;
        var _a = input_method_1.translate(buffer), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
        return _.assign({}, state, { buffer: buffer, translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols });
    },
    _d[actions_1.INPUT_METHOD.DELETE] = function (state, action) {
        var buffer = state.buffer.substring(0, state.buffer.length - 1);
        var _a = input_method_1.translate(buffer), translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, candidateSymbols = _a.candidateSymbols;
        return _.assign({}, state, { buffer: buffer, translation: translation, further: further, keySuggestions: keySuggestions, candidateSymbols: candidateSymbols });
    },
    _d[actions_1.INPUT_METHOD.ENABLE_IN_MINI_EDITOR] = function (state, action) { return _.assign({}, state, {
        enableInMiniEditor: action.payload
    }); },
    _d
), defaultState.inputMethod);
var header = redux_actions_1.handleActions((_e = {},
    _e[actions_1.HEADER.UPDATE] = function (state, action) { return action.payload; },
    _e
), defaultState.header);
var miniEditor = redux_actions_1.handleActions((_f = {},
    _f[actions_1.MINI_EDITOR.ACTIVATE] = function (state, action) { return _.assign({}, state, {
        activate: true,
        placeholder: action.payload
    }); },
    _f[actions_1.MINI_EDITOR.DEACTIVATE] = function (state, action) { return _.assign({}, state, {
        activate: false
    }); },
    _f
), defaultState.miniEditor);
var body = redux_actions_1.handleActions((_g = {},
    _g[actions_1.BODY.UPDATE_BANNER] = function (state, action) { return _.assign({}, state, {
        banner: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }); },
    _g[actions_1.BODY.UPDATE_BODY] = function (state, action) { return _.assign({}, state, {
        body: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }); },
    _g[actions_1.BODY.UPDATE_ERROR] = function (state, action) { return _.assign({}, state, {
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: action.payload,
        plainText: defaultState.body.plainText
    }); },
    _g[actions_1.BODY.UPDATE_PLAIN_TEXT] = function (state, action) { return _.assign({}, state, {
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: null,
        plainText: action.payload
    }); },
    _g[actions_1.BODY.UPDATE_MAX_BODY_HEIGHT] = function (state, action) { return _.assign({}, state, {
        maxBodyHeight: action.payload
    }); },
    _g
), defaultState.body);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = redux_1.combineReducers({
    view: view,
    header: header,
    inputMethod: inputMethod,
    miniEditor: miniEditor,
    body: body
});
var _b, _c, _d, _e, _f, _g;
//# sourceMappingURL=reducers.js.map