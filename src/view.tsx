import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware, Store } from 'redux';
// import thunk from 'redux-thunk';

import InputMethod from "./view/InputMethod";
// import App from "./view/App";
import reducer from './view/reducers';

const store = createStore(reducer);

export default function mount() {
    ReactDOM.render(
        <Provider store={store}>
            <InputMethod/>
        </Provider>,
        document.getElementById('agda-view')
    )
    return store;
}
