"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const redux_1 = require("redux");
const redux_actions_1 = require("redux-actions");
const actions_1 = require("./actions");
const input_method_1 = require("../input-method");
// default state
const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate('');
// const initialInternalState = InternalState.get();
const defaultState = {
    view: {
        activated: false,
        mounted: false,
        mountAt: {
            previous: null,
            current: 1 /* Bottom */
        },
        settingsView: false,
        settingsURI: {
            path: '/'
        }
    },
    mode: 0 /* Display */,
    connection: {
        querying: false,
        agda: null,
        agdaMessage: '',
    },
    protocol: {
        log: [],
        id: 0,
        limitLog: true
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
};
const view = redux_actions_1.handleActions({
    [actions_1.VIEW.ACTIVATE]: (state, _) => (Object.assign({}, state, { activated: true })),
    [actions_1.VIEW.DEACTIVATE]: (state, _) => (Object.assign({}, state, { activated: false })),
    [actions_1.VIEW.MOUNT]: (state, _) => (Object.assign({}, state, { mounted: true })),
    [actions_1.VIEW.UNMOUNT]: (state, _) => (Object.assign({}, state, { mounted: false })),
    [actions_1.VIEW.MOUNT_AT_PANE]: (state, _) => (Object.assign({}, state, { mountAt: {
            previous: state.mountAt.current,
            current: 0 /* Pane */
        } })),
    [actions_1.VIEW.MOUNT_AT_BOTTOM]: (state, _) => (Object.assign({}, state, { mountAt: {
            previous: state.mountAt.current,
            current: 1 /* Bottom */
        } })),
    [actions_1.VIEW.TOGGLE_SETTINGS_VIEW]: (state, _) => (Object.assign({}, state, { settingsView: !state.settingsView })),
    [actions_1.VIEW.NAVIGATE]: (state, action) => (Object.assign({}, state, { settingsView: true, settingsURI: action.payload })),
}, defaultState.view);
const mode = redux_actions_1.handleActions({
    [actions_1.MODE.DISPLAY]: (state, _) => 0 /* Display */,
    [actions_1.MODE.QUERY]: (state, _) => 1 /* Query */,
    [actions_1.MODE.QUERY_CONNECTION]: (state, _) => 2 /* QueryConnection */
}, defaultState.mode);
const connection = redux_actions_1.handleActions({
    [actions_1.CONNECTION.CONNECT_AGDA]: (state, action) => (Object.assign({}, state, { querying: false, agdaMessage: '', agda: action.payload })),
    [actions_1.CONNECTION.DISCONNECT_AGDA]: (state, action) => ({
        querying: false,
        agda: null,
        agdaMessage: '',
    }),
    [actions_1.CONNECTION.START_QUERYING]: (state, action) => (Object.assign({}, state, { querying: true })),
    [actions_1.CONNECTION.STOP_QUERYING]: (state, action) => (Object.assign({}, state, { querying: false })),
    [actions_1.CONNECTION.SET_AGDA_MESSAGE]: (state, action) => (Object.assign({}, state, { agdaMessage: action.payload })),
}, defaultState.connection);
function logResponses(log, response) {
    if (log.length > 0) {
        // append only to the last ReqRes;
        const tail = _.tail(log);
        let { id, request, responses } = _.first(log);
        return _.concat([{
                id,
                request,
                responses: _.concat(responses, response)
            }], tail);
    }
    else {
        return log;
    }
}
function logRequest(state, request) {
    let log = _.concat([{
            id: state.id,
            request,
            responses: []
        }], state.log);
    if (state.limitLog && log.length > 10) {
        return _.take(log, 10);
    }
    else {
        return log;
    }
}
const protocol = redux_actions_1.handleActions({
    [actions_1.PROTOCOL.LOG_REQUEST]: (state, action) => (Object.assign({}, state, { log: logRequest(state, action.payload), id: state.id + 1 })),
    [actions_1.PROTOCOL.LOG_RESPONSES]: (state, action) => (Object.assign({}, state, { log: logResponses(state.log, action.payload) })),
    [actions_1.PROTOCOL.LIMIT_LOG]: (state, action) => (Object.assign({}, state, { limitLog: action.payload })),
}, defaultState.protocol);
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
const query = redux_actions_1.handleActions({
    [actions_1.QUERY.SET_PLACEHOLDER]: (state, action) => (Object.assign({}, state, { placeholder: action.payload })),
    [actions_1.QUERY.UPDATE_VALUE]: (state, action) => (Object.assign({}, state, { value: action.payload }))
}, defaultState.query);
// export default reducer;
exports.default = redux_1.combineReducers({
    view,
    mode,
    connection,
    protocol,
    inputMethod,
    query
});
//# sourceMappingURL=reducers.js.map