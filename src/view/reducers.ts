import * as _ from 'lodash';
import { combineReducers } from 'redux';
import { createAction, handleActions, Action } from 'redux-actions';

declare var atom: any;

import { View } from '../types';
import { INPUT_METHOD, HEADER, MINI_EDITOR, BODY } from './actions';
import { translate } from '../input-method';

// default state
const { translation, further, keySuggestions, candidateSymbols } = translate('');
const defaultState: View.State = {
    header: {
        text: '',
        style: View.HeaderStyle.PlainText
    },
    inputMethod: {
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
        maxItemCount: atom.config.get('agda-mode.maxItemCount')
    }
};

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
    }
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
    [BODY.UPDATE_MAX_ITEM_COUNT]: (state: View.BodyState, action: Action<BODY.UPDATE_MAX_ITEM_COUNT>) => _.assign({}, state, {
        maxItemCount: action.payload
    })
}, defaultState.body);


// export default reducer;
export default combineReducers<View.State>({
    header,
    inputMethod,
    miniEditor,
    body
});
