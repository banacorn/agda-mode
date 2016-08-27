import * as _ from 'lodash';
import { View } from '../types';
import { INPUT_METHOD } from './actions';
import { combineReducers } from 'redux';
import { createAction, handleAction, handleActions, Action } from 'redux-actions';

const defaultState: View.State = {
    inputMethod: {
        activate: false,
        buffer: ""
    }
};

const inputMethod = handleActions<View.InputMethodState, INPUT_METHOD>({
    [INPUT_METHOD.ACTIVATE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.ACTIVATE>) => _.assign({}, state, {
        activate: true
    }),
    [INPUT_METHOD.DEACTIVATE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.DEACTIVATE>) => _.assign({}, state, {
        activate: false
    })
    // [INPUT_METHOD.SUGGEST_KEYS]: (state: View.InputMethodState, action: Action<INPUT_METHOD.SUGGEST_KEYS>) => _.assign({}, state, {
    //     keySuggestion: action.payload
    // })
}, defaultState.inputMethod);

// export default reducer;
export default combineReducers<View.State>({
    inputMethod,
});
