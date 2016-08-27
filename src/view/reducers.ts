import * as _ from 'lodash';
import { View } from '../types';
import { INPUT_METHOD } from './actions';
import { combineReducers } from 'redux';
import { createAction, handleAction, handleActions, Action } from 'redux-actions';

const defaultState: View.State = {
    inputMethod: {
        activated: false,
        buffer: ""
    }
};

const inputMethod = handleActions<View.InputMethodState, INPUT_METHOD>({
    [INPUT_METHOD.ACTIVATE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.ACTIVATE>) => _.assign({}, state, {
        activated: true,
        buffer: ""
    }),
    [INPUT_METHOD.DEACTIVATE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.DEACTIVATE>) => _.assign({}, state, {
        activated: false
    }),
    [INPUT_METHOD.INSERT]: (state: View.InputMethodState, action: Action<INPUT_METHOD.INSERT>) => _.assign({}, state, {
        buffer: state.buffer + action.payload
    }),
    [INPUT_METHOD.DELETE]: (state: View.InputMethodState, action: Action<INPUT_METHOD.INSERT>) => _.assign({}, state, {
        buffer: state.buffer.substring(0, state.buffer.length - 1)
    })
}, defaultState.inputMethod);

// export default reducer;
export default combineReducers<View.State>({
    inputMethod,
});
