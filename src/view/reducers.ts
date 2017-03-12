import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { inspect } from 'util';
import { createAction, handleActions, Action } from 'redux-actions';
import { EventEmitter } from 'events'
declare var atom: any;

import * as Parser from '../parser';
import { View } from '../types';
import { EVENT, VIEW, DEV, INPUT_METHOD, HEADER, MINI_EDITOR, BODY } from './actions';
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
        devView: false
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
    [VIEW.ACTIVATE]: (state: View.ViewState, action: Action<VIEW.ACTIVATE>) => _.assign({}, state, {
        activated: true
    }),
    [VIEW.DEACTIVATE]: (state: View.ViewState, action: Action<VIEW.DEACTIVATE>) => _.assign({}, state, {
        activated: false
    }),
    [VIEW.MOUNT]: (state: View.ViewState, action: Action<VIEW.MOUNT>) => _.assign({}, state, {
        mounted: true
    }),
    [VIEW.UNMOUNT]: (state: View.ViewState, action: Action<VIEW.UNMOUNT>) => _.assign({}, state, {
        mounted: false
    }),
    [VIEW.MOUNT_AT_PANE]: (state: View.ViewState, action: Action<VIEW.MOUNT_AT_PANE>) => _.assign({}, state, {
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Pane
        }
    }),
    [VIEW.MOUNT_AT_BOTTOM]: (state: View.ViewState, action: Action<VIEW.MOUNT_AT_BOTTOM>) => _.assign({}, state, {
        mountAt: {
            previous: state.mountAt.current,
            current: View.MountingPosition.Bottom
        }
    }),
    [VIEW.TOGGLE_DEV_VIEW]: (state: View.ViewState, action: Action<VIEW.TOGGLE_DEV_VIEW>) => _.assign({}, state, {
        devView: !state.devView
    })
}, defaultState.view);

const dev = handleActions<View.DevState, DEV>({
    [DEV.ADD_REQUEST]: (state: View.DevState, action: Action<DEV.ADD_REQUEST>) => {
        if (state.accumulate) {
            return _.assign({}, state, {
                messages: _.concat([{
                    kind: 'request',
                    raw: action.payload
                }], state.messages)
            });
        } else {
            return _.assign({}, state, {
                messages: [{
                    kind: 'request',
                    raw: action.payload
                }]
            });
        }
    },
    [DEV.ADD_RESPONSE]: (state: View.DevState, action: Action<DEV.ADD_RESPONSE>) => _.assign({}, state, {
        messages: _.concat([{
            kind: 'response',
            raw: action.payload,
            parsed: inspect(Parser.parseAgdaResponse(action.payload), false, null)
        }], state.messages)
    }),
    [DEV.CLEAR_ALL]: (state: View.DevState, action: Action<DEV.CLEAR_ALL>) => _.assign({}, state, {
        messages: []
    }),
    [DEV.TOGGLE_ACCUMULATE]: (state: View.DevState, action: Action<DEV.TOGGLE_ACCUMULATE>) => _.assign({}, state, {
        accumulate: !state.accumulate
    }),
    [DEV.TOGGLE_LSP]: (state: View.DevState, action: Action<DEV.TOGGLE_LSP>) => _.assign({}, state, {
        lsp: !state.lsp
    })
}, defaultState.dev);

const inputMethod = handleActions<View.InputMethodState, INPUT_METHOD>({
    [INPUT_METHOD.ACTIVATE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.ACTIVATE>) => {
        const { translation, further, keySuggestions, candidateSymbols } = translate('');
        return _.assign({}, state, {
            activated: true,
            buffer: '',
            translation, further, keySuggestions, candidateSymbols
        });
    },
    [INPUT_METHOD.DEACTIVATE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.DEACTIVATE>) => _.assign({}, state, {
        activated: false
    }),
    [INPUT_METHOD.INSERT]: (state: View.InputMethodState, action: Action<INPUT_METHOD.INSERT>) => {
        const buffer = state.buffer + action.payload;
        const { translation, further, keySuggestions, candidateSymbols } = translate(buffer);
        return _.assign({}, state, { buffer, translation, further, keySuggestions, candidateSymbols });
    },
    [INPUT_METHOD.DELETE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.DELETE>) => {
        const buffer = state.buffer.substring(0, state.buffer.length - 1);
        const { translation, further, keySuggestions, candidateSymbols } = translate(buffer);
        return _.assign({}, state, { buffer, translation, further, keySuggestions, candidateSymbols });
    },
    [INPUT_METHOD.ENABLE_IN_MINI_EDITOR]: (state: View.InputMethodState, action: Action<INPUT_METHOD.ENABLE_IN_MINI_EDITOR>) => _.assign({}, state, {
        enableInMiniEditor: action.payload
    })
}, defaultState.inputMethod);

const header = handleActions<View.HeaderState, HEADER>({
    [HEADER.UPDATE]: (state: View.HeaderState, action: Action<HEADER.UPDATE>) => action.payload
}, defaultState.header);


const miniEditor = handleActions<View.MiniEditorState, MINI_EDITOR>({
    [MINI_EDITOR.ACTIVATE]: (state: View.MiniEditorState, action: Action<MINI_EDITOR.ACTIVATE>) => _.assign({}, state, {
        activate: true,
        placeholder: action.payload
    }),
    [MINI_EDITOR.DEACTIVATE]: (state: View.MiniEditorState, action: Action<MINI_EDITOR.DEACTIVATE>) => _.assign({}, state, {
        activate: false
    })
}, defaultState.miniEditor);

const body = handleActions<View.BodyState, BODY>({
    [BODY.UPDATE_BANNER]: (state: View.BodyState, action: Action<BODY.UPDATE_BANNER>) => _.assign({}, state, {
        banner: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_BODY]: (state: View.BodyState, action: Action<BODY.UPDATE_BODY>) => _.assign({}, state, {
        body: action.payload,
        error: null,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_ERROR]: (state: View.BodyState, action: Action<BODY.UPDATE_ERROR>) => _.assign({}, state, {
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: action.payload,
        plainText: defaultState.body.plainText
    }),
    [BODY.UPDATE_PLAIN_TEXT]: (state: View.BodyState, action: Action<BODY.UPDATE_PLAIN_TEXT>) => _.assign({}, state, {
        banner: defaultState.body.banner,
        body: defaultState.body.body,
        error: null,
        plainText: action.payload
    }),
    [BODY.UPDATE_MAX_BODY_HEIGHT]: (state: View.BodyState, action: Action<BODY.UPDATE_MAX_BODY_HEIGHT>) => _.assign({}, state, {
        maxBodyHeight: action.payload
    })
}, defaultState.body);


// export default reducer;
export default combineReducers<View.State>({
    view,
    dev,
    header,
    inputMethod,
    miniEditor,
    body
});
