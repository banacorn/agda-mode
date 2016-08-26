import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
// import thunk from 'redux-thunk';

import App from "./view/App";
// import reducer from './reducer';
// import { lookup } from './actions';


const store = createStore((state, action) => state);
//     reducer,
//     applyMiddleware(thunk)
// );

export default function mount() {
    ReactDOM.render(
        <Provider store={store}>
            <App/>
        </Provider>,
        document.getElementById('agda-view')
    )
    return store;
}
