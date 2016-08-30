import * as _ from 'lodash';
import { EventEmitter } from 'events';
import { combineReducers } from 'redux';
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { View } from '../types';
import { INPUT_METHOD, HEADER, INPUT_EDITOR } from './actions';
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
    inputEditor: {
        activated: false,
        focused: false,
        placeholder: '',
        emitter: new EventEmitter
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

const inputEditor = handleActions<View.InputEditorState, INPUT_EDITOR>({
    [INPUT_EDITOR.ACTIVATE]: (state: View.InputEditorState, action: Action<INPUT_EDITOR.ACTIVATE>) => {
        return _.assign({}, state, {
            activated: true,
            placeholder: action.payload
        });
    },
    [INPUT_EDITOR.DEACTIVATE]: (state: View.InputEditorState, action: Action<INPUT_EDITOR.DEACTIVATE>) => {
        return _.assign({}, state, {
            activated: false
        });
    },
    [INPUT_EDITOR.FOCUSED]: (state: View.InputEditorState, action: Action<INPUT_EDITOR.FOCUSED>) => _.assign({}, state, {
        focused: true
    }),
    [INPUT_EDITOR.BLURRED]: (state: View.InputEditorState, action: Action<INPUT_EDITOR.BLURRED>) => _.assign({}, state, {
        focused: false
    })
}, defaultState.inputEditor);

// export default reducer;
export default combineReducers<View.State>({
    header,
    inputMethod,
    inputEditor
});
