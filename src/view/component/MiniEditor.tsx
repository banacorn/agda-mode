import * as _ from 'lodash';
import * as React from 'react';
import * as Promise from 'bluebird';
import * as classNames from 'classnames';

import { parseInputContent } from '../../parser';
import { TelePromise } from './../../util';
import { QueryCancelled } from './../../error';

import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            'atom-text-editor': any
        }
    }
}

type Props = React.HTMLProps<HTMLInputElement> & {
    placeholder?: string;

    onConfirm?: (payload: string) => void;
    onCancel?: () => void;
}

type State = {
    focused: boolean;
}

class MiniEditor extends React.Component<Props, State> {
    private subscriptions: Atom.CompositeDisposable;
    private ref: any;
    private observer: MutationObserver;
    private queryTP: TelePromise<string>;

    constructor(props: Props) {
        super(props);
        this.subscriptions = new CompositeDisposable;
        this.state = {
            focused: false
        }
        this.queryTP = new TelePromise;

    }

    private observeFocus() {
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
        // pass the grammar down to enable input method
        if (this.props['data-grammar'] === 'agda') {
            const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
            try {
                this.ref.getModel().setGrammar(agdaGrammar);
            } catch (e) {
                // do nothing when we fail to load the grammar
            }
        }

        // subscribe to Atom's core events
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = parseInputContent(this.ref.getModel().getText());
            if (this.props.onConfirm)
                this.props.onConfirm(payload);
            // resolve TelePromise for queries
            this.queryTP.resolve(payload);

        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            if (this.props.onCancel)
                this.props.onCancel();
            // reject TelePromise for queries
            this.queryTP.reject(new QueryCancelled);
        }));

        // observe 'focus'
        this.observeFocus();

        // placeholder
        if (this.props.placeholder)
            this.ref.getModel().setPlaceholderText(this.props.placeholder);

        // value
        if (this.props.value)
            this.ref.getModel().setText(this.props.value);
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
        if (this.observer)
            this.observer.disconnect();
    }

    // focus on the input box (with setTimeout quirk)
    focus() {
        setTimeout(() => {
            this.ref.focus();
        });
    }

    select() {
        this.ref.getModel().selectAll();
    }

    isFocused(): boolean {
        return this.state.focused;
    }

    getModel(): Atom.TextEditor {
        return this.ref.getModel();
    }

    activate() {
        this.focus();
        this.select();
    }

    query(): Promise<string> {
        return new Promise(this.queryTP.wire());
    }

    render() {
        if (this.ref && this.props.value)
            this.ref.getModel().setText(this.props.value.toString());

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
