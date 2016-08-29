import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import * as Promise from 'bluebird';
import * as _ from 'lodash';

import { View } from '../types';

import { parseInputContent } from '../parser';

type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');

declare var atom: any;

interface Props extends View.InputEditorState {
}

const mapStateToProps = (state: View.State) => {
    return state.inputEditor;
}

class InputEditor extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private ref: any;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }


    componentDidMount() {
        const { emitter } = this.props;
        this.subscriptions.add(atom.commands.add(this.ref, 'core:confirm', () => {
            const payload = parseInputContent(this.ref.getModel().getText());
            emitter.emit('confirm', payload);
        }));
        this.subscriptions.add(atom.commands.add(this.ref, 'core:cancel', () => {
            emitter.emit('cancel');
        }));
    }

    componentWillUnmount() {
        this.subscriptions.destroy();
    }

    // focus on the input box (with setTimeout quirk)
    focus() {
        setTimeout(() => { this.ref.focus(); });
    }

    select() {
        this.ref.getModel().selectAll();
    }

    render() {
        const { placeholder, activated } = this.props;
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
