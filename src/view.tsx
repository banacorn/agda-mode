import * as Promise from 'bluebird';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/Panel';
import reducer from './view/reducers';
import { View as V } from './types';
import { updateHeader, activateInputEditor, deactivateInputEditor } from './view/actions';
import { QueryCancelledError } from './error';
declare var atom: any;

const store = createStore(reducer);

export default class View {
    public store: Redux.Store<V.State>;

    constructor(private core: Core) {
        this.store = store;
    }

    mount() {
        ReactDOM.render(
            <Provider store={store}>
                <Panel core={this.core}/>
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

        this.store.dispatch(activateInputEditor(placeholder));
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        const { emitter } = this.store.getState().inputEditor;
        return new Promise<string>((resolve, reject) => {
            emitter.once('confirm', (payload) => {
                this.store.dispatch(deactivateInputEditor());
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                resolve(payload);
            });
            emitter.once('cancel', () => {
                this.store.dispatch(deactivateInputEditor());
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                reject(new QueryCancelledError(''));
            });
        });


        // this.header = header;
        // this.content = {
        //     body: message,
        //     type: type,
        //     placeholder: placeholder
        // };
        // this.headerStyle = toHeaderStyle(type);
        // // show input box, as it would had been hidden when initialized
        //
        // const promise = this.$refs.inputEditor.query(enableIM, placeholder);
        //
        // // hide input editor and give focus back
        // this.$once("input-editor:confirm", () => {
        //     this.queryMode = false;
        //     atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        // });
        // this.$once("input-editor:cancel", () => {
        //     this.queryMode = false;
        //     atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
        // });
        //
        // this.queryMode = true;

        // return promise;
    }
}
