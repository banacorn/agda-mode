import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { handleActions, Action } from 'redux-actions';
import { View, Agda } from '../type';
import { MODE, VIEW, PROTOCOL, INPUT_METHOD, QUERY, CONNECTION } from './actions';
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
        settingsURI: {
            path: '/'
        }
    },
    mode: View.Mode.Display,
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

const view = handleActions<View.ViewState, VIEW>({
    [VIEW.ACTIVATE]: (state, _) => ({ ...state,
        activated: true
    }),
    [VIEW.DEACTIVATE]: (state, _) => ({ ...state,
        activated: false
    }),
    [VIEW.MOUNT]: (state, _) => ({ ...state,
        mounted: true
    }),
    [VIEW.UNMOUNT]: (state, _) => ({ ...state,
        mounted: false
    }),
    [VIEW.MOUNT_AT_PANE]: (state, _) => ({ ...state,
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Pane
        }
    }),
    [VIEW.MOUNT_AT_BOTTOM]: (state, _) => ({ ...state,
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Bottom
        }
    }),
    [VIEW.TOGGLE_SETTINGS_VIEW]: (state, _) => ({ ...state,
        settingsView: !state.settingsView
    }),
    [VIEW.NAVIGATE]: (state, action: Action<VIEW.NAVIGATE>) => ({ ...state,
        settingsView: true,
        settingsURI: action.payload
    }),
}, defaultState.view);

const mode = handleActions<View.Mode, MODE>({
    [MODE.DISPLAY]: (state, _) => View.Mode.Display,
    [MODE.QUERY]: (state, _) => View.Mode.Query,
    [MODE.QUERY_CONNECTION]: (state, _) => View.Mode.QueryConnection
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
}, defaultState.connection);

function logResponses(log: View.ReqRes[], response: View.Parsed<Agda.Response>[]): View.ReqRes[] {
    if (log.length > 0) {
        // append only to the last ReqRes;
        const tail = _.tail(log);
        let { id, request, responses } = _.first(log);
        return _.concat([{
            id,
            request,
            responses: _.concat(responses, response)
        }], tail);
    } else {
        return log;
    }

}

function logRequest(state: View.Protocol, request: View.Parsed<Agda.Request>): View.ReqRes[] {
    let log = _.concat([{
        id: state.id,
        request,
        responses: []
    }], state.log);
    if (state.limitLog && log.length > 10) {
        return _.take(log, 10);
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

const query = handleActions<View.QueryState, QUERY>({
    [QUERY.SET_PLACEHOLDER]: (state, action: Action<QUERY.SET_PLACEHOLDER>) => ({ ...state,
        placeholder: action.payload
    }),
    [QUERY.UPDATE_VALUE]: (state, action: Action<QUERY.UPDATE_VALUE>) => ({ ...state,
        value: action.payload
    })
}, defaultState.query);

// export default reducer;
export default combineReducers<View.State>({
    view,
    mode,
    connection,
    protocol,
    inputMethod,
    query
});
