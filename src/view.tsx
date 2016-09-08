import * as _ from 'lodash';
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
import { EVENT } from "./view/actions";
import * as Action from "./view/actions";
import { parseContent, parseError} from './parser';
import { activateView, deactivateView, enableInMiniEditor } from './view/actions';
import { updateHeader, activateMiniEditor, updateBody, updateBanner, updateError, updatePlainText } from './view/actions';
declare var atom: any;

export default class View {
    public store: Redux.Store<V.State>;
    public miniEditor: MiniEditor;
    private mountingPosition: HTMLElement;
    private bottomPanel: any;

    constructor(private core: Core) {
        this.store = createStore(reducer);

        // global events
        const emitter = this.store.getState().emitter;
        emitter.on(EVENT.JUMP_TO_GOAL, (index: number) => {
            this.core.textBuffer.jumpToGoal(index);
        });
        emitter.on(EVENT.JUMP_TO_LOCATION, (loc: Location) => {
            this.core.textBuffer.jumpToLocation(loc);
        });

        // this.mount();
    }

    private state() {
        return this.store.getState().view;
    }

    private render() {
        ReactDOM.render(
            <Provider store={this.store}>
                <Panel
                    core={this.core}
                    onMiniEditorMount={(editor) => {
                        this.miniEditor = editor;
                    }}
                    mountAtPane={() => {
                        console.log('mount at pane')
                    }}
                    mountAtBottom={() => {
                        console.log('mount at bottom')
                    }}
                />
            </Provider>,
            this.mountingPosition
        )
    }

    mount() {
        if (!this.state().mounted) {
            console.log('mount')
            // Redux
            this.store.dispatch(Action.mountView());
            // mounting position
            this.mountingPosition = document.createElement('article');
            this.bottomPanel = atom.workspace.addBottomPanel({
                item: this.mountingPosition,
                visible: true,
                className: 'agda-view'
            });

            // render
            this.render();

        }
    }

    unmount() {
        if (this.state().mounted) {
            console.log('unmount')
            // Redux
            this.store.dispatch(Action.unmountView());
            // React
            ReactDOM.unmountComponentAtNode(this.mountingPosition);
            // mounting position
            this.mountingPosition = null;
        }
    }


    activate() {
        this.store.dispatch(activateView());
    }

    deactivate() {
        this.store.dispatch(deactivateView());
    }

    // destructor
    destroy() {
        this.bottomPanel.destroy();
    }

    set(header: string, payload: string[], type = V.Style.PlainText) {
        this.store.dispatch(updateHeader({
            text: header,
            style: type
        }));

        if (type === V.Style.Info || type === V.Style.Success) {
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

    query(header: string = '', message: string[] = [], type: V.Style = V.Style.PlainText, placeholder: string = '', inputMethodOn = true): Promise<string> {
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
