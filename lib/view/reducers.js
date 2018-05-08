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
        settingsURI: '/'
    },
    mode: 0 /* Display */,
    connection: {
        agda: null,
        agdaMessage: '',
        languageServer: null
    },
    protocol: {
        log: [],
        pending: false,
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
        body: {
            goalAndHave: [],
            goals: [],
            judgements: [],
            terms: [],
            metas: [],
            sorts: [],
            warnings: [],
            errors: []
        },
        solutions: {
            kind: 'SimpleSolutions',
            message: '',
            solutions: []
        },
        error: null,
        plainText: '',
        maxBodyHeight: 170
    },
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
    [actions_1.VIEW.TOGGLE_SETTINGS_VIEW]: (state, action) => (Object.assign({}, state, { settingsView: !state.settingsView })),
    [actions_1.VIEW.NAVIGATE]: (state, action) => (Object.assign({}, state, { settingsView: true, settingsURI: action.payload })),
}, defaultState.view);
const mode = redux_actions_1.handleActions({
    [actions_1.MODE.DISPLAY]: (state, action) => 0 /* Display */,
    [actions_1.MODE.QUERY]: (state, action) => 1 /* Query */,
    [actions_1.MODE.QUERY_CONNECTION]: (state, action) => 2 /* QueryConnection */
}, defaultState.mode);
const connection = redux_actions_1.handleActions({
    [actions_1.CONNECTION.CONNECT]: (state, action) => (Object.assign({}, state, { agda: action.payload })),
    [actions_1.CONNECTION.DISCONNECT]: (state, action) => ({
        agda: null,
        agdaMessage: '',
        languageServer: null
    }),
    [actions_1.CONNECTION.SET_AGDA_MESSAGE]: (state, action) => (Object.assign({}, state, { agdaMessage: action.payload })),
}, defaultState.connection);
function logResponse(log, response) {
    // append only to the last ReqRes;
    const init = _.initial(log);
    let { request, responses } = _.last(log);
    return _.concat(init, [{
            request,
            responses: _.concat(responses, response)
        }]);
}
const protocol = redux_actions_1.handleActions({
    [actions_1.PROTOCOL.LOG_REQUEST]: (state, action) => (Object.assign({}, state, { log: _.concat(state.log, [{
                request: action.payload,
                responses: []
            }]) })),
    [actions_1.PROTOCOL.LOG_RESPONSES]: (state, action) => (Object.assign({}, state, { log: logResponse(state.log, action.payload) })),
    [actions_1.PROTOCOL.CLEAR_ALL]: (state, action) => (Object.assign({}, state, { log: [] })),
    [actions_1.PROTOCOL.TOGGLE_LSP]: (state, action) => (Object.assign({}, state, { lsp: !state.lsp })),
    [actions_1.PROTOCOL.PENDING]: (state, action) => (Object.assign({}, state, { pending: action.payload }))
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
const header = redux_actions_1.handleActions({
    [actions_1.HEADER.UPDATE]: (state, action) => action.payload
}, defaultState.header);
const query = redux_actions_1.handleActions({
    [actions_1.QUERY.SET_PLACEHOLDER]: (state, action) => (Object.assign({}, state, { placeholder: action.payload })),
    [actions_1.QUERY.UPDATE_VALUE]: (state, action) => (Object.assign({}, state, { value: action.payload }))
}, defaultState.query);
const body = redux_actions_1.handleActions({
    [actions_1.BODY.UPDATE_BODY]: (state, action) => (Object.assign({}, state, { body: action.payload, solutions: defaultState.body.solutions, error: null, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_ERROR]: (state, action) => (Object.assign({}, state, { body: defaultState.body.body, solutions: defaultState.body.solutions, error: action.payload, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_SOLUTIONS]: (state, action) => (Object.assign({}, state, { body: defaultState.body.body, solutions: action.payload, error: null, plainText: defaultState.body.plainText })),
    [actions_1.BODY.UPDATE_PLAIN_TEXT]: (state, action) => (Object.assign({}, state, { body: defaultState.body.body, solutions: defaultState.body.solutions, error: null, plainText: action.payload })),
    [actions_1.BODY.UPDATE_MAX_BODY_HEIGHT]: (state, action) => (Object.assign({}, state, { maxBodyHeight: action.payload }))
}, defaultState.body);
// export default reducer;
exports.default = redux_1.combineReducers({
    view,
    mode,
    connection,
    protocol,
    header,
    inputMethod,
    query,
    body
});
//# sourceMappingURL=reducers.js.map