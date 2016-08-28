import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/Panel';
import reducer from './view/reducers';

const store = createStore(reducer);

export default function mount(core: Core) {
    ReactDOM.render(
        <Provider store={store}>
            <Panel core={core} />
        </Provider>,
        document.getElementById('agda-view')
    )
    return store;
}
