import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

import { View } from '../types';
import { focusedInputEditor, blurredInputEditor } from './actions';

import { parseInputContent } from '../parser';

type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');

import { EventEmitter } from 'events';

declare var atom: any;

interface Props extends React.DOMAttributes {
    activated: boolean;
    focused: boolean;   // fact
    placeholder: string;
    emitter: EventEmitter;
}

const mapStateToProps = (state: View.State) => {
    return state.inputEditor;
}

class InputEditor extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private ref: any;
    private observer: MutationObserver;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }


    observeClassList(callback: (mutation: MutationRecord) => any) {
        // create an observer instance
        this.observer = new MutationObserver((mutations) => {
            mutations
                .filter((m) => m.attributeName === 'class')
                .forEach(callback)
        });
        // configuration of the observer:
        var config = { attributes: true };
        // pass in the target node, as well as the observer options
        this.observer.observe(this.ref, config);
    }

    componentDidMount() {
        const { emitter } = this.props;


        // set grammar: agda to enable input method
        const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
        this.ref.getModel().setGrammar(agdaGrammar);

        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = parseInputContent(this.ref.getModel().getText());
            emitter.emit('confirm', payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            emitter.emit('cancel');
        }));

        this.observeClassList(() => {
            const focused = _.includes(this.ref.classList, 'is-focused');
            if (this.props.focused !== focused) {
                if (focused) {
                    if (_.isFunction(this.props.onFocus))
                        this.props.onFocus(null);
                }
                else {
                    if (_.isFunction(this.props.onFocus))
                        this.props.onBlur(null);
                }
            }
        });
    }

    componentWillUnmount() {
        this.subscriptions.destroy();
        this.observer.disconnect();
    }

    // focus on the input box (with setTimeout quirk)
    focus() {
        setTimeout(() => {
            this.ref.focus();
        });
    }

    blur() {
        setTimeout(() => {
            this.ref.blur();
        });
    }
    select() {
        this.ref.getModel().selectAll();
    }

    render() {
        const { placeholder, activated, focused } = this.props;
        const hidden = classNames({'hidden': !activated});
        if (activated) {
            this.ref.getModel().setPlaceholderText(placeholder);
            this.focus();
            this.select();
        }

        return (
            <atom-text-editor
                class={hidden}
                mini
                placeholder-text={placeholder}
                ref={(ref) => { this.ref = ref; }}
            ></atom-text-editor>
        )
    }
}


export default connect<any, any, any>(
    mapStateToProps,
    null
)(InputEditor);
