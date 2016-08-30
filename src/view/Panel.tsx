import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

declare var atom: any;

import Core from '../core';
import InputMethod from './InputMethod';
import Header from './Header';
import { View } from '../types';
import InputEditor from './InputEditor';
import { deactivateMiniEditor } from './actions';

interface Props extends View.State {
    core: Core;

    onMiniEditorMount: (editor: InputEditor) => void;
    deactivateMiniEditor: () => void;
}

const mapStateToProps = (state : View.State) => state

const mapDispatchToProps = (dispatch: any) => ({
    deactivateMiniEditor: () => {
        dispatch(deactivateMiniEditor());
    }
})

class Panel extends React.Component<Props, void> {
    render() {
        const { core, onMiniEditorMount } = this.props;
        const hideMiniEditor = classNames({'hidden': !this.props.miniEditor.activate});
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
                        className={hideMiniEditor}
                        ref={(ref) => {
                            if (ref) onMiniEditorMount(ref);
                        }}
                        onConfirm={() => {
                            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                            this.props.deactivateMiniEditor();
                        }}
                        onCancel={() => {
                            atom.views.getView(atom.workspace.getActiveTextEditor()).focus()
                            this.props.deactivateMiniEditor();
                        }}
                    />
                </section>
            </section>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(Panel);
