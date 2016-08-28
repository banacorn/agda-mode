import * as _ from 'lodash';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore, applyMiddleware, Store } from 'redux';
import Core from "./core";
declare var atom: any;

import InputMethod from "./view/InputMethod";
import reducer from './view/reducers';

const store = createStore(reducer);

export default function mount(core: Core) {
    ReactDOM.render(
        <Provider store={store}>
            <InputMethod
                updateTranslation={(c) => core.inputMethod.replaceBuffer(c)}
                insertCharacter={(c) => {
                    core.inputMethod.insertCharToBufffer(c);
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                }}
                chooseSymbol={(c) => {
                    core.inputMethod.replaceBuffer(c);
                    core.inputMethod.deactivate();
                    atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
                }}
            />
        </Provider>,
        document.getElementById('agda-view')
    )
    return store;
}
