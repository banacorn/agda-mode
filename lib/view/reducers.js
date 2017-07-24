"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const redux_1 = require("redux");
const util_1 = require("util");
const redux_actions_1 = require("redux-actions");
const Parser = require("../parser");
const Store = require("../persist");
const actions_1 = require("./actions");
const input_method_1 = require("../input-method");
// default state
const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate('');
const initialInternalState = Store.get();
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
    mode: 0 /* Display */,
    connection: {
        connectionInfos: initialInternalState.connections,
        selected: initialInternalState.selected,
        connected: initialInternalState.connected,
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
        activated: false,
        buffer: '',
        translation, further, keySuggestions, candidateSymbols
    },
    query: {
        placeholder: '',
        value: ''
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
    },
    settings: '/'
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
const mode = redux_actions_1.handleActions({
    [actions_1.MODE.DISPLAY]: (state, action) => 0 /* Display */,
    [actions_1.MODE.QUERY]: (state, action) => 1 /* Query */,
    [actions_1.MODE.QUERY_CONNECTION]: (state, action) => 2 /* QueryConnection */
}, defaultState.mode);
const connection = redux_actions_1.handleActions({
    [actions_1.CONNECTION.ADD_CONNECTION]: (state, action) => (Object.assign({}, state, { connectionInfos: _.concat([action.payload], state.connectionInfos) })),
    [actions_1.CONNECTION.REMOVE_CONNECTION]: (state, action) => (Object.assign({}, state, { connectionInfos: _.remove(state.connectionInfos, (connInfo) => connInfo['guid'] !== action.payload) })),
    [actions_1.CONNECTION.SELECT_CONNECTION]: (state, action) => (Object.assign({}, state, { selected: action.payload })),
    [actions_1.CONNECTION.CONNECT]: (state, action) => (Object.assign({}, state, { connected: action.payload })),
    [actions_1.CONNECTION.DISCONNECT]: (state, action) => (Object.assign({}, state, { connected: undefined })),
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
}, defaultState.inputMethod);
const header = redux_actions_1.handleActions({
    [actions_1.HEADER.UPDATE]: (state, action) => action.payload
}, defaultState.header);
const query = redux_actions_1.handleActions({
    [actions_1.QUERY.SET_PLACEHOLDER]: (state, action) => (Object.assign({}, state, { placeholder: action.payload })),
    [actions_1.QUERY.UPDATE_VALUE]: (state, action) => (Object.assign({}, state, { value: action.payload }))
}, defaultState.query);
const body = redux_actions_1.handleActions({
    [actions_1.BODY.UPDATE_BANNER]: (state, action) => (Object.assign({}, state, { banner: action.payload, error: null, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_BODY]: (state, action) => (Object.assign({}, state, { body: action.payload, error: null, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_ERROR]: (state, action) => (Object.assign({}, state, { banner: defaultState.body.banner, body: defaultState.body.body, error: action.payload, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_PLAIN_TEXT]: (state, action) => (Object.assign({}, state, { banner: defaultState.body.banner, body: defaultState.body.body, error: null, plainText: action.payload })),
    [actions_1.BODY.UPDATE_MAX_BODY_HEIGHT]: (state, action) => (Object.assign({}, state, { maxBodyHeight: action.payload }))
}, defaultState.body);
const settings = redux_actions_1.handleActions({
    [actions_1.SETTINGS.NAVIGATE]: (state, action) => action.payload
}, defaultState.settings);
// export default reducer;
exports.default = redux_1.combineReducers({
    view,
    mode,
    connection,
    dev,
    header,
    inputMethod,
    query,
    body,
    settings
});
//# sourceMappingURL=reducers.js.map