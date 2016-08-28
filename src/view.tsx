import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/Panel';
import reducer from './view/reducers';
import { View as V } from './types';
import { updateHeader } from './view/actions';

const store = createStore(reducer);

export default class View {
    public store: Redux.Store<V.State>;

    constructor(private core: Core) {
        this.store = store;
    }

    mount() {
        ReactDOM.render(
            <Provider store={store}>
                <Panel core={this.core} />
            </Provider>,
            document.getElementById('agda-view')
        )
    }

    set(header: string, body: string[], type = V.HeaderStyle.PlainText) {
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));
    }

}
