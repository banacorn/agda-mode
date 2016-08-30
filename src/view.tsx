import * as Promise from 'bluebird';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/Panel';
import InputEditor from './view/InputEditor';
import reducer from './view/reducers';
import { View as V } from './types';
import { updateHeader, activateMiniEditor } from './view/actions';
declare var atom: any;

const store = createStore(reducer);

export default class View {
    public store: Redux.Store<V.State>;
    private miniEditor: InputEditor;

    constructor(private core: Core) {
        this.store = store;
    }

    mount() {
        ReactDOM.render(
            <Provider store={store}>
                <Panel
                    core={this.core}
                    onMiniEditorMount={(editor) => {
                        this.miniEditor = editor;
                    }}
                />
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

    query(header: string, message: string[], type: V.HeaderStyle, placeholder: string): Promise<string> {

        this.store.dispatch(activateMiniEditor());
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        this.miniEditor.activate();
        return this.miniEditor.query();
    }
}
