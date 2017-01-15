"use strict";
const _ = require("lodash");
const redux_1 = require("redux");
const util_1 = require("util");
const redux_actions_1 = require("redux-actions");
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
        devView: false
    },
    dev: {
        messages: [],
        accumulate: false
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
    [actions_1.VIEW.ACTIVATE]: (state, action) => _.assign({}, state, {
        activated: true
    }),
    [actions_1.VIEW.DEACTIVATE]: (state, action) => _.assign({}, state, {
        activated: false
    }),
    [actions_1.VIEW.MOUNT]: (state, action) => _.assign({}, state, {
        mounted: true
    }),
    [actions_1.VIEW.UNMOUNT]: (state, action) => _.assign({}, state, {
        mounted: false
    }),
    [actions_1.VIEW.MOUNT_AT_PANE]: (state, action) => _.assign({}, state, {
        mountAt: {
            previous: state.mountAt.current,
            current: 0 /* Pane */
        }
    }),
    [actions_1.VIEW.MOUNT_AT_BOTTOM]: (state, action) => _.assign({}, state, {
        mountAt: {
            previous: state.mountAt.current,
            current: 1 /* Bottom */
        }
    }),
    [actions_1.VIEW.TOGGLE_DEV_VIEW]: (state, action) => _.assign({}, state, {
        devView: !state.devView
    })
}, defaultState.view);
const dev = redux_actions_1.handleActions({
    [actions_1.DEV.ADD_REQUEST]: (state, action) => {
        if (state.accumulate) {
            return _.assign({}, state, {
                messages: _.concat([{
                        kind: 'request',
                        raw: action.payload
                    }], state.messages)
            });
        }
        else {
            return _.assign({}, state, {
                messages: [{
                        kind: 'request',
                        raw: action.payload
                    }]
            });
        }
    },
    [actions_1.DEV.ADD_RESPONSE]: (state, action) => _.assign({}, state, {
        messages: _.concat([{
                kind: 'response',
                raw: action.payload,
                parsed: util_1.inspect(Parser.parseAgdaResponse(action.payload), false, null)
            }], state.messages)
    }),
    [actions_1.DEV.CLEAR_ALL]: (state, action) => _.assign({}, state, {
        messages: []
    }),
    [actions_1.DEV.TOGGLE_ACCUMULATE]: (state, action) => _.assign({}, state, {
        accumulate: !state.accumulate
    })
}, defaultState.dev);
const inputMethod = redux_actions_1.handleActions({
    [actions_1.INPUT_METHOD.ACTIVATE]: (state, action) => {
        const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate('');
        return _.assign({}, state, {
            activated: true,
            buffer: '',
            translation, further, keySuggestions, candidateSymbols
        });
    },
    [actions_1.INPUT_METHOD.DEACTIVATE]: (state, action) => _.assign({}, state, {
        activated: false
    }),
    [actions_1.INPUT_METHOD.INSERT]: (state, action) => {
        const buffer = state.buffer + action.payload;
        const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate(buffer);
        return _.assign({}, state, { buffer, translation, further, keySuggestions, candidateSymbols });
    },
    [actions_1.INPUT_METHOD.DELETE]: (state, action) => {
        const buffer = state.buffer.substring(0, state.buffer.length - 1);
        const { translation, further, keySuggestions, candidateSymbols } = input_method_1.translate(buffer);
        return _.assign({}, state, { buffer, translation, further, keySuggestions, candidateSymbols });
    },
    [actions_1.INPUT_METHOD.ENABLE_IN_MINI_EDITOR]: (state, action) => _.assign({}, state, {
        enableInMiniEditor: action.payload
    })
}, defaultState.inputMethod);
const header = redux_actions_1.handleActions({
    [actions_1.HEADER.UPDATE]: (state, action) => action.payload
}, defaultState.header);
const miniEditor = redux_actions_1.handleActions({
    [actions_1.MINI_EDITOR.ACTIVATE]: (state, action) => _.assign({}, state, {
        activate: true,
        placeholder: action.payload
    }),
    [actions_1.MINI_EDITOR.DEACTIVATE]: (state, action) => _.assign({}, state, {
        activate: false
    })
}, defaultState.miniEditor);
const body = redux_actions_1.handleActions({
    [actions_1.BODY.UPDATE_BANNER]: (state, action) => _.assign({}, state, {
        banner: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [actions_1.BODY.UPDATE_BODY]: (state, action) => _.assign({}, state, {
        body: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [actions_1.BODY.UPDATE_ERROR]: (state, action) => _.assign({}, state, {
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: action.payload,
        plainText: defaultState.body.plainText
    }),
    [actions_1.BODY.UPDATE_PLAIN_TEXT]: (state, action) => _.assign({}, state, {
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: null,
        plainText: action.payload
    }),
    [actions_1.BODY.UPDATE_MAX_BODY_HEIGHT]: (state, action) => _.assign({}, state, {
        maxBodyHeight: action.payload
    })
}, defaultState.body);
Object.defineProperty(exports, "__esModule", { value: true });
// export default reducer;
exports.default = redux_1.combineReducers({
    view,
    dev,
    header,
    inputMethod,
    miniEditor,
    body
});
//# sourceMappingURL=reducers.js.map