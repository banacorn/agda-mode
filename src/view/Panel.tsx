import * as React from 'react';
import { connect } from 'react-redux';

declare var atom: any;

import Core from '../core';
import InputMethod from './InputMethod';
import Header from './Header';
import { View } from '../types';
import InputEditor from './InputEditor';

interface Props extends View.State {
    core: Core;

    onMiniEditorMount: (editor: InputEditor) => void;
}

const mapStateToProps = (state : View.State) => {
    return state
}

class Panel extends React.Component<Props, void> {
    // private miniEditor: InputEditor;
    // query() {
    //     miniEditor.q
    // }
    render() {
        const { core, onMiniEditorMount } = this.props;

        return (
            <section>
                <header>
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
                    <Header/>
                </header>
                <section>
                    <InputEditor
                        activate={this.props.miniEditor.activate}
                        ref={(ref) => {
                            if (ref)
                                onMiniEditorMount(ref);
                        }}
                    />
                </section>
            </section>
        )
    }
}
// {this.props.miniEditor.activate ? <InputEditor/> : null}
    //
    // <InputEditor
    //     ref={(editor) => {
    //         // console.log(editor)
    //
    //         // console.log(`activate mini editor: ${this.props.miniEditor.activate}`);
    //         // if (this.props.miniEditor.activate && editor) {
    //         //     editor.activate()
    //         // }
    //     }}
    //
    //     // onFocus={() => {
    //     //     console.log('focus')
    //     // }}
    // />
export default connect<any, any, any>(
    mapStateToProps,
    null
)(Panel);
