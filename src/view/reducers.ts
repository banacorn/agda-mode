import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { inspect } from 'util';
import { createAction, handleActions, Action } from 'redux-actions';
import { EventEmitter } from 'events'
declare var atom: any;

import * as Conn from '../connector';
import * as Parser from '../parser';
import * as Store from '../persist';
import { View } from '../type';
import { EVENT, MODE, VIEW, CONNECTION, PROTOCOL, INPUT_METHOD, HEADER, QUERY, BODY, SETTINGS } from './actions';
import { translate } from '../input-method';

// default state
const { translation, further, keySuggestions, candidateSymbols } = translate('');

const initialInternalState = Store.get();
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
    connection: {
        connectionInfos: initialInternalState.connections,
        selected: initialInternalState.selected,
        connected: initialInternalState.connected,
        showNewConnectionView: false
    },
    protocol: {
        vanilla: {
            messages: [],
            accumulate: false
        },
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

const connection = handleActions<View.ConnectionState, CONNECTION>({
    [CONNECTION.ADD_CONNECTION]: (state, action: Action<CONNECTION.ADD_CONNECTION>) => ({ ...state,
        connectionInfos: _.concat([action.payload], state.connectionInfos)
    }),
    [CONNECTION.REMOVE_CONNECTION]: (state, action: Action<CONNECTION.REMOVE_CONNECTION>) => ({ ...state,
        connectionInfos: _.remove(state.connectionInfos, (connInfo) => connInfo['guid'] !== action.payload)
    }),
    [CONNECTION.SELECT_CONNECTION]: (state, action: Action<CONNECTION.SELECT_CONNECTION>) => ({ ...state,
        selected: action.payload
    }),
    [CONNECTION.CONNECT]: (state, action: Action<CONNECTION.CONNECT>) => ({ ...state,
        connected: action.payload
    }),
    [CONNECTION.DISCONNECT]: (state, action: Action<CONNECTION.CONNECT>) => ({ ...state,
        connected: undefined
    }),
    [CONNECTION.SHOW_NEW_CONNECTION_VIEW]: (state, action: Action<CONNECTION.SHOW_NEW_CONNECTION_VIEW>) => ({ ...state,
        showNewConnectionView: action.payload
    })
}, defaultState.connection);


const protocol = handleActions<View.Protocol, PROTOCOL>({
    [PROTOCOL.ADD_REQUEST]: (state, action: Action<PROTOCOL.ADD_REQUEST>) => {
        if (state.vanilla.accumulate) {
            return ({ ...state,
                messages: _.concat([{
                    kind: 'request',
                    raw: action.payload
                } as View.DevMsg], state.vanilla.messages)
            });
        } else {
            return ({ ...state,
                messages: [{
                    kind: 'request',
                    raw: action.payload
                } as View.DevMsg]
            });
        }
    },
    [PROTOCOL.ADD_RESPONSE]: (state, action: Action<PROTOCOL.ADD_RESPONSE>) => ({ ...state,
        messages: _.concat([{
            kind: 'response',
            raw: action.payload,
            parsed: inspect(Parser.parseAgdaResponse(action.payload), false, null)
        } as View.DevMsg], state.vanilla.messages)
    }),
    [PROTOCOL.CLEAR_ALL]: (state, action: Action<PROTOCOL.CLEAR_ALL>) => ({ ...state,
        messages: []
    }),
    [PROTOCOL.TOGGLE_ACCUMULATE]: (state, action: Action<PROTOCOL.TOGGLE_ACCUMULATE>) => ({ ...state,
        accumulate: !state.vanilla.accumulate
    }),
    [PROTOCOL.TOGGLE_LSP]: (state, action: Action<PROTOCOL.TOGGLE_LSP>) => ({ ...state,
        lsp: !state.lsp
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
    [BODY.UPDATE_BANNER]: (state, action: Action<BODY.UPDATE_BANNER>) => ({ ...state,
        banner: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_BODY]: (state, action: Action<BODY.UPDATE_BODY>) => ({ ...state,
        body: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_ERROR]: (state, action: Action<BODY.UPDATE_ERROR>) => ({ ...state,
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: action.payload,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_PLAIN_TEXT]: (state, action: Action<BODY.UPDATE_PLAIN_TEXT>) => ({ ...state,
        banner: defaultState.body.banner,
        body: defaultState.body.body,
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
    connection,
    protocol,
    header,
    inputMethod,
    query,
    body,
    settings
});
