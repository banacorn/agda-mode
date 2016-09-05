import * as Promise from 'bluebird';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider, connect } from 'react-redux';
import { createStore } from 'redux';

import Core from './core';
import Panel from './view/component/Panel';
import MiniEditor from './view/component/MiniEditor';
import reducer from './view/reducers';
import { View as V, Location } from './types';
import { EVENT, jumpToGoal } from "./view/actions";
import { parseContent, parseError} from './parser';
import { activateView, deactivateView, enableInMiniEditor } from './view/actions';
import { updateHeader, activateMiniEditor, updateBody, updateBanner, updateError, updatePlainText } from './view/actions';
declare var atom: any;

export default class View {
    public store: Redux.Store<V.State>;
    public miniEditor: MiniEditor;
    public panel: any;

    constructor(private core: Core) {
        this.store = createStore(reducer);

        // create an anchor element for the view to mount
        const anchor = document.createElement('agda-view');
        anchor.id = 'agda-panel';
        const atomPanel = atom.workspace.addBottomPanel({
            item: anchor,
            visible: true,
            className: 'agda-view'
        });


        this.panel = atom.workspace.addBottomPanel({
            item: document.createElement('agda-view'),
            visible: false,
            className: 'agda-view'
        });

        const emitter = this.store.getState().emitter;
        emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });

        ReactDOM.render(
            <Provider store={this.store}>
                <Panel
                    core={this.core}
                    onMiniEditorMount={(editor) => {
                        this.miniEditor = editor;
                    }}
                />
            </Provider>,
            document.getElementById('agda-panel')
        )
    }

    activate() {
        this.store.dispatch(activateView());
    }

    deactivate() {
        this.store.dispatch(deactivateView());
    }

    destroy() {
        this.panel.destroy();
    }

    set(header: string, payload: string[], type = V.Style.PlainText) {
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        if (type === V.Style.Judgement || type === V.Style.Value) {
            const { banner, body } = parseContent(payload);
            const grouped = _.groupBy(body, 'judgementForm');
            this.store.dispatch(updateBanner(banner));
            this.store.dispatch(updateBody({
                goal: (grouped['goal'] || []) as V.Goal[],
                judgement: (grouped['type judgement'] || []) as V.Judgement[],
                term: (grouped['term'] || []) as V.Term[],
                meta: (grouped['meta'] || []) as V.Meta[],
                sort: (grouped['sort'] || []) as V.Sort[]
            }));
        } else if (type === V.Style.Error) {
            const error = parseError(payload.join('\n'));
            this.store.dispatch(updateError(error));
        } else {
            this.store.dispatch(updatePlainText(payload.join('\n')));
        }
    }

    query(header: string, message: string[], type: V.Style, placeholder: string, inputMethodOn = true): Promise<string> {
        this.store.dispatch(enableInMiniEditor(inputMethodOn));
        this.store.dispatch(activateMiniEditor(placeholder));
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        this.miniEditor.activate();
        return this.miniEditor.query();
    }
}
