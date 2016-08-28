import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/Panel';
import reducer from './view/reducers';

const store = createStore(reducer);

export default class View {

    constructor(private core: Core) {}

    mount() {
        ReactDOM.render(
            <Provider store={store}>
                <Panel core={this.core} />
            </Provider>,
            document.getElementById('agda-view')
        )
        return store;
    }
}
