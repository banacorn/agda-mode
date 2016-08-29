import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

import { View } from '../types';
import { focusedInputEditor, blurredInputEditor, focusInputEditor, blurInputEditor } from './actions';

import { parseInputContent } from '../parser';

type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');

declare var atom: any;

interface Props extends View.InputEditorState {
    onFocused: () => void;
    onBlurred: () => void;
    onFocus: () => void;
    onBlur: () => void;
}

const mapStateToProps = (state: View.State) => {
    return state.inputEditor;
}

const mapDispatchToProps = (dispatch: any) => ({
    onFocused: () => {
        dispatch(focusedInputEditor());
    },
    onBlurred: () => {
        dispatch(blurredInputEditor());
    },
    onFocus: () => {
        dispatch(focusInputEditor());
    },
    onBlur: () => {
        dispatch(blurInputEditor());
    },
})

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

        // focus on the input box (with setTimeout quirk)
        emitter.on('focus', () => {
            setTimeout(() => {
                this.ref.focus();
            });
        })
        emitter.on('blur', () => {
            setTimeout(() => {
                this.ref.blur();
            });
        })


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
                if (focused)
                    this.props.onFocused();
                else
                    this.props.onBlurred();
            }
        });
    }

    componentWillUnmount() {
        this.subscriptions.destroy();
        this.observer.disconnect();
    }


    select() {
        this.ref.getModel().selectAll();
    }

    render() {
        const { placeholder, activated, focused } = this.props;
        const hidden = classNames({'hidden': !activated});
        //
        // // set grammar: agda to enable input method
        // if (enableIM) {
        //     const agdaGrammar = atom.grammars.grammarForScopeName('source.agda');
        //     textEditor.setGrammar(agdaGrammar);
        // } else {
        //     textEditor.setGrammar();
        // }
        if (activated) {
            this.ref.getModel().setPlaceholderText(placeholder);
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
    mapDispatchToProps
)(InputEditor);
