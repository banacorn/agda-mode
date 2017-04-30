import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { inspect } from 'util';
import { createAction, handleActions, Action } from 'redux-actions';
import { EventEmitter } from 'events'
declare var atom: any;

import * as Parser from '../parser';
import { View } from '../type';
import { EVENT, VIEW, CONNECTION, DEV, INPUT_METHOD, HEADER, MINI_EDITOR, BODY } from './actions';
import { translate } from '../input-method';

// default state
const { translation, further, keySuggestions, candidateSymbols } = translate('');
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
    connection: {
        connections: [],
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
        style: View.Style.PlainText
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

const connection = handleActions<View.ConnectionState, CONNECTION>({
    [CONNECTION.ADD_CONNECTION]: (state, action: Action<CONNECTION.ADD_CONNECTION>) => ({ ...state,
        connections: _.concat([action.payload], state.connections)
    }),
    [CONNECTION.SHOW_NEW_CONNECTION_VIEW]: (state, action: Action<CONNECTION.SHOW_NEW_CONNECTION_VIEW>) => ({ ...state,
        showNewConnectionView: action.payload
    }),
}, defaultState.connection);


const dev = handleActions<View.DevState, DEV>({
    [DEV.ADD_REQUEST]: (state, action: Action<DEV.ADD_REQUEST>) => {
        if (state.accumulate) {
            return ({ ...state,
                messages: _.concat([{
                    kind: 'request',
                    raw: action.payload
                } as View.DevMsg], state.messages)
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
    [DEV.ADD_RESPONSE]: (state, action: Action<DEV.ADD_RESPONSE>) => ({ ...state,
        messages: _.concat([{
            kind: 'response',
            raw: action.payload,
            parsed: inspect(Parser.parseAgdaResponse(action.payload), false, null)
        } as View.DevMsg], state.messages)
    }),
    [DEV.CLEAR_ALL]: (state, action: Action<DEV.CLEAR_ALL>) => ({ ...state,
        messages: []
    }),
    [DEV.TOGGLE_ACCUMULATE]: (state, action: Action<DEV.TOGGLE_ACCUMULATE>) => ({ ...state,
        accumulate: !state.accumulate
    }),
    [DEV.TOGGLE_LSP]: (state, action: Action<DEV.TOGGLE_LSP>) => ({ ...state,
        lsp: !state.lsp
    })
}, defaultState.dev);

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
    [INPUT_METHOD.ENABLE_IN_MINI_EDITOR]: (state, action: Action<INPUT_METHOD.ENABLE_IN_MINI_EDITOR>) => ({ ...state,
        enableInMiniEditor: action.payload
    })
}, defaultState.inputMethod);

const header = handleActions<View.HeaderState, HEADER>({
    [HEADER.UPDATE]: (state, action: Action<HEADER.UPDATE>) => action.payload
}, defaultState.header);


const miniEditor = handleActions<View.MiniEditorState, MINI_EDITOR>({
    [MINI_EDITOR.ACTIVATE]: (state, action: Action<MINI_EDITOR.ACTIVATE>) => ({ ...state,
        activate: true,
        placeholder: action.payload
    }),
    [MINI_EDITOR.DEACTIVATE]: (state, action: Action<MINI_EDITOR.DEACTIVATE>) => ({ ...state,
        activate: false
    })
}, defaultState.miniEditor);

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


// export default reducer;
export default combineReducers<View.State>({
    view,
    connection,
    dev,
    header,
    inputMethod,
    miniEditor,
    body
});
