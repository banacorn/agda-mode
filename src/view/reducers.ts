import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { inspect } from 'util';
import { createAction, handleActions, Action } from 'redux-actions';
import { EventEmitter } from 'events'
import * as Conn from '../connection';
import * as Parser from '../parser';
import { View, Agda, Parsed } from '../type';
import { EVENT, MODE, VIEW, PROTOCOL, INPUT_METHOD, HEADER, QUERY, BODY, CONNECTION } from './actions';
import { translate } from '../input-method';

// default state
const { translation, further, keySuggestions, candidateSymbols } = translate('');

// const initialInternalState = InternalState.get();
const defaultState: View.State = {
    view: {
        activated: false,
        mounted: false,
        mountAt: {
            previous: null,
            current: View.MountingPosition.Bottom
        },
        settingsView: false,
        settingsURI: '/'
    },
    mode: View.Mode.Display,
    connection: {
        querying: false,
        agda: null,
        agdaMessage: '',
        languageServerEnabled: atom.config.get('agda-mode.languageServerEnabled'),
        languageServer: null,
        languageServerMessage: '',
    },
    protocol: {
        log: [],
        id: 0,
        pending: false,
        lsp: false,
        limitLog: true
    },
    header: {
        text: '',
        style: View.Style.PlainText
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

const view = handleActions<View.ViewState, VIEW>({
    [VIEW.ACTIVATE]: (state, action) => ({ ...state,
        activated: true
    }),
    [VIEW.DEACTIVATE]: (state, action) => ({ ...state,
        activated: false
    }),
    [VIEW.MOUNT]: (state, action) => ({ ...state,
        mounted: true
    }),
    [VIEW.UNMOUNT]: (state, action) => ({ ...state,
        mounted: false
    }),
    [VIEW.MOUNT_AT_PANE]: (state, action) => ({ ...state,
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Pane
        }
    }),
    [VIEW.MOUNT_AT_BOTTOM]: (state, action) => ({ ...state,
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Bottom
        }
    }),
    [VIEW.TOGGLE_SETTINGS_VIEW]: (state, action) => ({ ...state,
        settingsView: !state.settingsView
    }),
    [VIEW.NAVIGATE]: (state, action: Action<VIEW.NAVIGATE>) => ({ ...state,
        settingsView: true,
        settingsURI: action.payload
    }),
}, defaultState.view);

const mode = handleActions<View.Mode, MODE>({
    [MODE.DISPLAY]: (state, action) => View.Mode.Display,
    [MODE.QUERY]: (state, action) => View.Mode.Query,
    [MODE.QUERY_CONNECTION]: (state, action) => View.Mode.QueryConnection
}, defaultState.mode);

const connection = handleActions<View.ConnectionState, CONNECTION>({
    [CONNECTION.CONNECT_AGDA]: (state, action: Action<CONNECTION.CONNECT_AGDA>) => ({ ...state,
        querying: false,
        agdaMessage: '',
        agda: action.payload
    }),
    [CONNECTION.DISCONNECT_AGDA]: (state, action: Action<CONNECTION.DISCONNECT_AGDA>) => ({
        querying: false,
        agda: null,
        agdaMessage: '',
        languageServerEnabled: state.languageServerEnabled,
        languageServer: null,
        languageServerMessage: ''
    }),
    [CONNECTION.ENABLE_LANGUAGE_SERVER]: (state, action: Action<CONNECTION.ENABLE_LANGUAGE_SERVER>) => ({ ...state,
        languageServerEnabled: action.payload
    }),
    [CONNECTION.START_QUERYING]: (state, action: Action<CONNECTION.START_QUERYING>) => ({ ...state,
        querying: true
    }),
    [CONNECTION.STOP_QUERYING]: (state, action: Action<CONNECTION.STOP_QUERYING>) => ({ ...state,
        querying: false
    }),
    [CONNECTION.SET_AGDA_MESSAGE]: (state, action: Action<CONNECTION.SET_AGDA_MESSAGE>) => ({ ...state,
        agdaMessage: action.payload
    }),
    [CONNECTION.SET_LANGUAGE_SERVER_MESSAGE]: (state, action: Action<CONNECTION.SET_LANGUAGE_SERVER_MESSAGE>) => ({ ...state,
        languageServerMessage: action.payload
    }),
}, defaultState.connection);

function logResponses(log: View.ReqRes[], response: Parsed<Agda.Response>[]): View.ReqRes[] {
    if (log.length > 0) {
        // append only to the last ReqRes;
        const init = _.initial(log);
        let { id, request, responses } = _.last(log);
        return _.concat(init, [{
            id,
            request,
            responses: _.concat(responses, response)
        }]);
    } else {
        return log;
    }

}

function logRequest(state: View.Protocol, request: Parsed<Agda.Request>): View.ReqRes[] {
    let log = _.concat(state.log, [{
        id: state.id,
        request,
        responses: []
    }]);
    if (state.limitLog && log.length >= 10) {
        return _.tail(log);
    } else {
        return log;
    }
}

const protocol = handleActions<View.Protocol, PROTOCOL>({
    [PROTOCOL.LOG_REQUEST]: (state, action: Action<PROTOCOL.LOG_REQUEST>) => ({ ...state,
        log: logRequest(state, action.payload),
        id: state.id + 1
    }),
    [PROTOCOL.LOG_RESPONSES]: (state, action: Action<PROTOCOL.LOG_RESPONSES>) => ({ ...state,
        log: logResponses(state.log, action.payload)
    }),
    [PROTOCOL.LIMIT_LOG]: (state, action: Action<PROTOCOL.LIMIT_LOG>) => ({ ...state,
        limitLog: action.payload
    }),
    [PROTOCOL.TOGGLE_LSP]: (state, action: Action<PROTOCOL.TOGGLE_LSP>) => ({ ...state,
        lsp: !state.lsp
    }),
    [PROTOCOL.PENDING]: (state, action: Action<PROTOCOL.PENDING>) => ({ ...state,
        pending: action.payload
    }),
}, defaultState.protocol);

const inputMethod = handleActions<View.InputMethodState, INPUT_METHOD>({
    [INPUT_METHOD.ACTIVATE]: (state, action: Action<INPUT_METHOD.ACTIVATE>) => {
        const { translation, further, keySuggestions, candidateSymbols } = translate('');
        return ({ ...state,
            activated: true,
            buffer: '',
            translation, further, keySuggestions, candidateSymbols
        });
    },
    [INPUT_METHOD.DEACTIVATE]: (state, action: Action<INPUT_METHOD.DEACTIVATE>) => ({ ...state,
        activated: false
    }),
    [INPUT_METHOD.INSERT]: (state, action: Action<INPUT_METHOD.INSERT>) => {
        const buffer = state.buffer + action.payload;
        const { translation, further, keySuggestions, candidateSymbols } = translate(buffer);
        return ({ ...state, buffer, translation, further, keySuggestions, candidateSymbols });
    },
    [INPUT_METHOD.DELETE]: (state, action: Action<INPUT_METHOD.DELETE>) => {
        const buffer = state.buffer.substring(0, state.buffer.length - 1);
        const { translation, further, keySuggestions, candidateSymbols } = translate(buffer);
        return ({ ...state, buffer, translation, further, keySuggestions, candidateSymbols });
    },
}, defaultState.inputMethod);

const header = handleActions<View.HeaderState, HEADER>({
    [HEADER.UPDATE]: (state, action: Action<HEADER.UPDATE>) => action.payload
}, defaultState.header);

const query = handleActions<View.QueryState, QUERY>({
    [QUERY.SET_PLACEHOLDER]: (state, action: Action<QUERY.SET_PLACEHOLDER>) => ({ ...state,
        placeholder: action.payload
    }),
    [QUERY.UPDATE_VALUE]: (state, action: Action<QUERY.UPDATE_VALUE>) => ({ ...state,
        value: action.payload
    })
}, defaultState.query);

const body = handleActions<View.BodyState, BODY>({
    [BODY.UPDATE_BODY]: (state, action: Action<BODY.UPDATE_BODY>) => ({ ...state,
        body: action.payload,
        solutions: defaultState.body.solutions,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_ERROR]: (state, action: Action<BODY.UPDATE_ERROR>) => ({ ...state,
        body: defaultState.body.body,
        solutions: defaultState.body.solutions,
        error: action.payload,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_SOLUTIONS]: (state, action: Action<BODY.UPDATE_SOLUTIONS>) => ({ ...state,
        body: defaultState.body.body,
        solutions: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_PLAIN_TEXT]: (state, action: Action<BODY.UPDATE_PLAIN_TEXT>) => ({ ...state,
        body: defaultState.body.body,
        solutions: defaultState.body.solutions,
        error: null,
        plainText: action.payload
    }),
    [BODY.UPDATE_MAX_BODY_HEIGHT]: (state, action: Action<BODY.UPDATE_MAX_BODY_HEIGHT>) => ({ ...state,
        maxBodyHeight: action.payload
    })
}, defaultState.body);


// export default reducer;
export default combineReducers<View.State>({
    view,
    mode,
    connection,
    protocol,
    header,
    inputMethod,
    query,
    body
});
