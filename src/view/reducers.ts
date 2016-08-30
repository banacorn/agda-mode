import * as _ from 'lodash';
import { EventEmitter } from 'events';
import { combineReducers } from 'redux';
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { View } from '../types';
import { INPUT_METHOD, HEADER, MINI_EDITOR } from './actions';
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

// export default reducer;
export default combineReducers<View.State>({
    header,
    inputMethod,
    miniEditor
});
