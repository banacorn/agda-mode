import * as _ from 'lodash';
import { View } from '../types';
import { INPUT_METHOD } from './actions';
import { combineReducers } from 'redux';
import { createAction, handleAction, handleActions, Action } from 'redux-actions';

type State = View.State;

const defaultState: State = {
    inputMethodMode: false
};

const reducer = handleActions<State, INPUT_METHOD>({
    [INPUT_METHOD.ACTIVATE]: (state: State, action: Action<INPUT_METHOD.ACTIVATE>) => _.assign({}, state, {
        inputMethodMode: true
    }),
    [INPUT_METHOD.DEACTIVATE]: (state: State, action: Action<INPUT_METHOD.DEACTIVATE>) => _.assign({}, state, {
        inputMethodMode: false
    })
}, defaultState);

export default reducer;
// export default combineReducers({
//     entry,
//     status,
//     history
// })
