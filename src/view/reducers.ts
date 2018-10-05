import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { handleActions, Action } from 'redux-actions';
import { View, Agda } from '../type';
import { MODE, VIEW, PROTOCOL, INPUT_METHOD, HEADER, QUERY, BODY, CONNECTION } from './actions';
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
        pending: false,
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
        emacs: {
            allGoalsWarnings: ['', ''],
            goalTypeContext: '',
            error: null,
            message: '',
        },
        allGoalsWarnings: null,
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
    [BODY.UPDATE_All_GOALS_WARNINGS]: (state, action: Action<BODY.UPDATE_All_GOALS_WARNINGS>) => ({ ...state,
        emacs:              defaultState.body.emacs,
        allGoalsWarnings:   action.payload,
        solutions:          defaultState.body.solutions,
        error:              defaultState.body.error,
        plainText:          defaultState.body.plainText
    }),
    [BODY.UPDATE_EMACS_All_GOALS_WARNINGS]: (state, action: Action<BODY.UPDATE_EMACS_All_GOALS_WARNINGS>) => ({ ...state,
        emacs: {
            allGoalsWarnings:   action.payload,
            goalTypeContext:    defaultState.body.emacs.goalTypeContext,
            error:              defaultState.body.emacs.error,
            message:            defaultState.body.emacs.message,
        },
        allGoalsWarnings:   defaultState.body.allGoalsWarnings,
        solutions:          defaultState.body.solutions,
        error:              defaultState.body.error,
        plainText:          defaultState.body.plainText
    }),
    [BODY.UPDATE_EMACS_GOAL_TYPE_CONTEXT]: (state, action: Action<BODY.UPDATE_EMACS_GOAL_TYPE_CONTEXT>) => ({ ...state,
        emacs: {
            allGoalsWarnings:   defaultState.body.emacs.allGoalsWarnings,
            goalTypeContext:    action.payload,
            error:              defaultState.body.emacs.error,
            message:            defaultState.body.emacs.message,
        },
        allGoalsWarnings:   defaultState.body.allGoalsWarnings,
        solutions:          defaultState.body.solutions,
        error:              defaultState.body.error,
        plainText:          defaultState.body.plainText
    }),
    [BODY.UPDATE_ERROR]: (state, action: Action<BODY.UPDATE_ERROR>) => ({ ...state,
        emacs:              defaultState.body.emacs,
        allGoalsWarnings:   defaultState.body.allGoalsWarnings,
        solutions:          defaultState.body.solutions,
        error:              action.payload[0],
        plainText:          defaultState.body.plainText
    }),
    [BODY.UPDATE_EMACS_ERROR]: (state, action: Action<BODY.UPDATE_EMACS_ERROR>) => ({ ...state,
        emacs: {
            allGoalsWarnings:   defaultState.body.emacs.allGoalsWarnings,
            goalTypeContext:    defaultState.body.emacs.goalTypeContext,
            error:              action.payload,
            message:            defaultState.body.emacs.message,
        },
        allGoalsWarnings:   defaultState.body.allGoalsWarnings,
        solutions:          defaultState.body.solutions,
        error:              defaultState.body.error,
        plainText:          defaultState.body.plainText
    }),
    [BODY.UPDATE_SOLUTIONS]: (state, action: Action<BODY.UPDATE_SOLUTIONS>) => ({ ...state,
        emacs:              defaultState.body.emacs,
        allGoalsWarnings:   defaultState.body.allGoalsWarnings,
        solutions:          action.payload,
        error:              defaultState.body.error,
        plainText:          defaultState.body.plainText
    }),
    [BODY.UPDATE_PLAIN_TEXT]: (state, action: Action<BODY.UPDATE_PLAIN_TEXT>) => ({ ...state,
        emacs:              defaultState.body.emacs,
        allGoalsWarnings:   defaultState.body.allGoalsWarnings,
        solutions:          defaultState.body.solutions,
        error:              defaultState.body.error,
        plainText:          action.payload
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
