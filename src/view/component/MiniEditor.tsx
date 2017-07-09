import * as _ from 'lodash';
import * as React from 'react';
import * as Promise from 'bluebird';
import * as classNames from 'classnames';

import { parseInputContent } from '../../parser';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'atom-text-editor': any
        }
    }
}

type Props = React.HTMLProps<HTMLElement> & {
    placeholder?: string;

    onConfirm?: (payload: string) => void;
    onCancel?: () => void;
}

type State = {
    focused: boolean;
}

class MiniEditor extends React.Component<Props, State> {
    private subscriptions: CompositeDisposable;
    private ref: any;
    private observer: MutationObserver;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
        this.state = {
            focused: false
        }
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
        // pass the grammar down to enable input method
        if (this.props['data-grammar'] === "source agda") {
            const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
            this.ref.getModel().setGrammar(agdaGrammar);
        }

        // subscribe to Atom's core events
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = parseInputContent(this.ref.getModel().getText());
            if (this.props.onConfirm)
                this.props.onConfirm(payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            if (this.props.onCancel)
                this.props.onCancel();
        }));

        // focus and select on did mount
        this.focus();
        this.select();

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
    private focus() {
        setTimeout(() => {
            this.ref.focus();
        });
    }

    private select() {
        this.ref.getModel().selectAll();
    }

    isFocused(): boolean {
        return this.state.focused;
    }

    getModel() {
        return this.ref.getModel();
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
