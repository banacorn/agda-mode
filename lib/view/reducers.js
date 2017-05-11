"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const redux_1 = require("redux");
const util_1 = require("util");
const redux_actions_1 = require("redux-actions");
const Conn = require("../connector");
const Parser = require("../parser");
const actions_1 = require("./actions");
const input_method_1 = require("../input-method");
// default state
const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate('');
const defaultState = {
    view: {
        activated: false,
        mounted: false,
        mountAt: {
            previous: null,
            current: 1 /* Bottom */
        },
        settingsView: false
    },
    connection: {
        connections: Conn.getConnections(),
        pinned: JSON.parse(atom.config.get('agda-mode.internalState')).pinned,
        current: undefined,
        showNewConnectionView: false
    },
    dev: {
        messages: [],
        accumulate: false,
        lsp: false
    },
    header: {
        text: '',
        style: 0 /* PlainText */
    },
    inputMethod: {
        enableInMiniEditor: true,
        activated: false,
        buffer: '',
        translation, further, keySuggestions, candidateSymbols
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
const view = redux_actions_1.handleActions({
    [actions_1.VIEW.ACTIVATE]: (state, action) => (Object.assign({}, state, { activated: true })),
    [actions_1.VIEW.DEACTIVATE]: (state, action) => (Object.assign({}, state, { activated: false })),
    [actions_1.VIEW.MOUNT]: (state, action) => (Object.assign({}, state, { mounted: true })),
    [actions_1.VIEW.UNMOUNT]: (state, action) => (Object.assign({}, state, { mounted: false })),
    [actions_1.VIEW.MOUNT_AT_PANE]: (state, action) => (Object.assign({}, state, { mountAt: {
            previous: state.mountAt.current,
            current: 0 /* Pane */
        } })),
    [actions_1.VIEW.MOUNT_AT_BOTTOM]: (state, action) => (Object.assign({}, state, { mountAt: {
            previous: state.mountAt.current,
            current: 1 /* Bottom */
        } })),
    [actions_1.VIEW.TOGGLE_SETTINGS_VIEW]: (state, action) => (Object.assign({}, state, { settingsView: !state.settingsView }))
}, defaultState.view);
const connection = redux_actions_1.handleActions({
    [actions_1.CONNECTION.ADD_CONNECTION]: (state, action) => (Object.assign({}, state, { connections: _.concat([action.payload], state.connections) })),
    [actions_1.CONNECTION.REMOVE_CONNECTION]: (state, action) => (Object.assign({}, state, { connections: _.remove(state.connections, (conn) => conn['guid'] !== action.payload) })),
    [actions_1.CONNECTION.PIN_CONNECTION]: (state, action) => (Object.assign({}, state, { pinned: action.payload })),
    [actions_1.CONNECTION.SHOW_NEW_CONNECTION_VIEW]: (state, action) => (Object.assign({}, state, { showNewConnectionView: action.payload }))
}, defaultState.connection);
const dev = redux_actions_1.handleActions({
    [actions_1.DEV.ADD_REQUEST]: (state, action) => {
        if (state.accumulate) {
            return (Object.assign({}, state, { messages: _.concat([{
                        kind: 'request',
                        raw: action.payload
                    }], state.messages) }));
        }
        else {
            return (Object.assign({}, state, { messages: [{
                        kind: 'request',
                        raw: action.payload
                    }] }));
        }
    },
    [actions_1.DEV.ADD_RESPONSE]: (state, action) => (Object.assign({}, state, { messages: _.concat([{
                kind: 'response',
                raw: action.payload,
                parsed: util_1.inspect(Parser.parseAgdaResponse(action.payload), false, null)
            }], state.messages) })),
    [actions_1.DEV.CLEAR_ALL]: (state, action) => (Object.assign({}, state, { messages: [] })),
    [actions_1.DEV.TOGGLE_ACCUMULATE]: (state, action) => (Object.assign({}, state, { accumulate: !state.accumulate })),
    [actions_1.DEV.TOGGLE_LSP]: (state, action) => (Object.assign({}, state, { lsp: !state.lsp }))
}, defaultState.dev);
const inputMethod = redux_actions_1.handleActions({
    [actions_1.INPUT_METHOD.ACTIVATE]: (state, action) => {
        const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate('');
        return (Object.assign({}, state, { activated: true, buffer: '', translation, further, keySuggestions, candidateSymbols }));
    },
    [actions_1.INPUT_METHOD.DEACTIVATE]: (state, action) => (Object.assign({}, state, { activated: false })),
    [actions_1.INPUT_METHOD.INSERT]: (state, action) => {
        const buffer = state.buffer + action.payload;
        const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate(buffer);
        return (Object.assign({}, state, { buffer, translation, further, keySuggestions, candidateSymbols }));
    },
    [actions_1.INPUT_METHOD.DELETE]: (state, action) => {
        const buffer = state.buffer.substring(0, state.buffer.length - 1);
        const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate(buffer);
        return (Object.assign({}, state, { buffer, translation, further, keySuggestions, candidateSymbols }));
    },
    [actions_1.INPUT_METHOD.ENABLE_IN_MINI_EDITOR]: (state, action) => (Object.assign({}, state, { enableInMiniEditor: action.payload }))
}, defaultState.inputMethod);
const header = redux_actions_1.handleActions({
    [actions_1.HEADER.UPDATE]: (state, action) => action.payload
}, defaultState.header);
const miniEditor = redux_actions_1.handleActions({
    [actions_1.MINI_EDITOR.ACTIVATE]: (state, action) => (Object.assign({}, state, { activate: true, placeholder: action.payload })),
    [actions_1.MINI_EDITOR.DEACTIVATE]: (state, action) => (Object.assign({}, state, { activate: false }))
}, defaultState.miniEditor);
const body = redux_actions_1.handleActions({
    [actions_1.BODY.UPDATE_BANNER]: (state, action) => (Object.assign({}, state, { banner: action.payload, error: null, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_BODY]: (state, action) => (Object.assign({}, state, { body: action.payload, error: null, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_ERROR]: (state, action) => (Object.assign({}, state, { banner: defaultState.body.banner, body: defaultState.body.body, error: action.payload, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_PLAIN_TEXT]: (state, action) => (Object.assign({}, state, { banner: defaultState.body.banner, body: defaultState.body.body, error: null, plainText: action.payload })),
    [actions_1.BODY.UPDATE_MAX_BODY_HEIGHT]: (state, action) => (Object.assign({}, state, { maxBodyHeight: action.payload }))
}, defaultState.body);
// export default reducer;
exports.default = redux_1.combineReducers({
    view,
    connection,
    dev,
    header,
    inputMethod,
    miniEditor,
    body
});
//# sourceMappingURL=reducers.js.map