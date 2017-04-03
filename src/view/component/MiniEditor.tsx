import * as _ from 'lodash';
import * as React from 'react';
import * as Promise from 'bluebird';
import { EventEmitter } from 'events';
import * as classNames from 'classnames';

import { parseInputContent } from '../../parser';
import { QueryCancelledError } from '../../error';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;


interface Props extends React.HTMLAttributes {
    placeholder?: string;

    onConfirm?: (payload: string) => void;
    onCancel?: () => void;
}

interface State {
    focused: boolean;
}

class MiniEditor extends React.Component<Props, State> {
    private subscriptions: CompositeDisposable;
    private ref: any;
    private observer: MutationObserver;
    private emitter: EventEmitter;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
        this.state = {
            focused: false
        }
        this.emitter = new EventEmitter;
    }

    observeFocus() {
        // create an observer instance
        this.observer = new MutationObserver((mutations) => {
            mutations
                .filter((m) => m.attributeName === 'class')
                .forEach(() => {
                    const focusedBefore = this.state.focused;
                    const focusedNow = _.includes(this.ref.classList, 'is-focused');
                    if (focusedNow !== focusedBefore) {
                        // update state: focused
                        this.setState({
                            focused: focusedNow
                        } as State)

                        // trigger events
                        if (focusedNow) {
                            if (_.isFunction(this.props.onFocus))
                                this.props.onFocus(null);
                        }
                        else {
                            if (_.isFunction(this.props.onFocus))
                                this.props.onBlur(null);
                        }
                    }
                })
        });
        // configuration of the observer:
        var config = { attributes: true };
        // pass in the target node, as well as the observer options
        this.observer.observe(this.ref, config);
    }

    componentDidMount() {
        // set grammar: agda to enable input method
        const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
        this.ref.getModel().setGrammar(agdaGrammar);

        // subscribe to Atom's core events
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = parseInputContent(this.ref.getModel().getText());
            this.emitter.emit('confirm', payload);
            if (this.props.onConfirm)
                this.props.onConfirm(payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            this.emitter.emit('cancel');
            if (this.props.onCancel)
                this.props.onCancel();
        }));

        // observe 'focus'
        this.observeFocus();

        // placeholder
        if (this.props.placeholder)
            this.ref.getModel().setPlaceholderText(this.props.placeholder);
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
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

    isFocused(): boolean {
        return this.state.focused;
    }

    getModel() {
        return this.ref.getModel();
    }

    activate() {
        this.focus();
        this.select();
    }

    query(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.emitter.once('confirm', (payload) => {
                this.emitter.removeAllListeners()
                resolve(payload);
            });
            this.emitter.once('cancel', () => {
                this.emitter.removeAllListeners();
                reject(new QueryCancelledError(''));
            });
        });
    }

    render() {
        const classes = classNames(this.props.className, 'mini-editor');
        return (
            <atom-text-editor
                class={classes}
                mini
                ref={(ref) => {
                    if (ref)
                        this.ref = ref
                }}
            ></atom-text-editor>
        )
    }
}

export default MiniEditor;
