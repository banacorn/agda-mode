import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { inspect } from 'util';
import { createAction, handleActions, Action } from 'redux-actions';
import { EventEmitter } from 'events'
import * as Conn from '../connection';
import * as Parser from '../parser';
import { View, Agda, Parsed } from '../type';
import { EVENT, MODE, VIEW, PROTOCOL, INPUT_METHOD, HEADER, QUERY, BODY, SETTINGS } from './actions';
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
        settingsView: false
    },
    mode: View.Mode.Display,
    // connection: {
    //     connectionInfos: initialInternalState.connections,
    //     selected: initialInternalState.selected,
    //     connected: initialInternalState.connected,
    //     erred: [],
    //     showNewConnectionView: false
    // },
    protocol: {
        log: [],
        pending: false,
        lsp: false
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
    settings: '/'
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
    })
}, defaultState.view);

const mode = handleActions<View.Mode, MODE>({
    [MODE.DISPLAY]: (state, action) => View.Mode.Display,
    [MODE.QUERY]: (state, action) => View.Mode.Query,
    [MODE.QUERY_CONNECTION]: (state, action) => View.Mode.QueryConnection
}, defaultState.mode);

// const connection = handleActions<View.ConnectionState, CONNECTION>({
//     [CONNECTION.ADD_CONNECTION]: (state, action: Action<CONNECTION.ADD_CONNECTION>) => ({ ...state,
//         connectionInfos: _.concat([action.payload], state.connectionInfos)
//     }),
//     [CONNECTION.REMOVE_CONNECTION]: (state, action: Action<CONNECTION.REMOVE_CONNECTION>) => ({ ...state,
//         connectionInfos: _.filter(state.connectionInfos, (connInfo) => connInfo.guid !== action.payload),
//         erred: _.filter(state.erred, guid => guid !== action.payload)
//     }),
//     [CONNECTION.SELECT_CONNECTION]: (state, action: Action<CONNECTION.SELECT_CONNECTION>) => ({ ...state,
//         selected: action.payload
//     }),
//     [CONNECTION.CONNECT]: (state, action: Action<CONNECTION.CONNECT>) => ({ ...state,
//         connected: action.payload,
//         erred: _.filter(state.erred, guid => guid !== action.payload)
//     }),
//     [CONNECTION.DISCONNECT]: (state, action: Action<CONNECTION.CONNECT>) => ({ ...state,
//         connected: undefined
//     }),
//     [CONNECTION.ERR]: (state, action: Action<CONNECTION.ERR>) => ({ ...state,
//         erred: _.uniq(_.concat([action.payload], state.erred))
//     }),
//     [CONNECTION.SHOW_NEW_CONNECTION_VIEW]: (state, action: Action<CONNECTION.SHOW_NEW_CONNECTION_VIEW>) => ({ ...state,
//         showNewConnectionView: action.payload
//     })
// }, defaultState.connection);

function logResponse(log: View.ReqRes[], response: Parsed<Agda.Response>[]): View.ReqRes[] {
    // append only to the last ReqRes;
    const init = _.initial(log);
    let { request, responses } = _.last(log);
    return _.concat(init, [{
        request,
        responses: _.concat(responses, response)
    }]);
}

const protocol = handleActions<View.Protocol, PROTOCOL>({
    [PROTOCOL.LOG_REQUEST]: (state, action: Action<PROTOCOL.LOG_REQUEST>) => ({ ...state,
        log: _.concat(state.log, [{
            request: action.payload,
            responses: []
        }])
    }),
    [PROTOCOL.LOG_RESPONSES]: (state, action: Action<PROTOCOL.LOG_RESPONSES>) => ({ ...state,
        log: logResponse(state.log, action.payload)
    }),
    [PROTOCOL.CLEAR_ALL]: (state, action: Action<PROTOCOL.CLEAR_ALL>) => ({ ...state,
        log: []
    }),
    [PROTOCOL.TOGGLE_LSP]: (state, action: Action<PROTOCOL.TOGGLE_LSP>) => ({ ...state,
        lsp: !state.lsp
    }),
    [PROTOCOL.PENDING]: (state, action: Action<PROTOCOL.PENDING>) => ({ ...state,
        pending: action.payload
    })
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

const settings = handleActions<View.SettingsPath, SETTINGS>({
    [SETTINGS.NAVIGATE]: (state, action: Action<SETTINGS.NAVIGATE>) => action.payload
}, defaultState.settings);


// export default reducer;
export default combineReducers<View.State>({
    view,
    mode,
    // connection,
    protocol,
    header,
    inputMethod,
    query,
    body,
    settings
});
