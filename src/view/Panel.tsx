import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

declare var atom: any;

import Core from '../core';
import InputMethod from './InputMethod';
import Header from './Header';
import Body from './Body';
import { View } from '../types';
import MiniEditor from './MiniEditor';
import { deactivateMiniEditor } from './actions';

interface Props extends View.State {
    core: Core;

    onMiniEditorMount: (editor: MiniEditor) => void;
    deactivateMiniEditor: () => void;
    jumpToGoal: (index: number) => void;
    jumpToLocation: (loc: View.Location) => void;
}

const mapStateToProps = (state : View.State) => state

const mapDispatchToProps = (dispatch: any) => ({
    deactivateMiniEditor: () => {
        dispatch(deactivateMiniEditor());
    }
})

class Panel extends React.Component<Props, void> {
    render() {
        const { core, onMiniEditorMount, jumpToGoal, jumpToLocation } = this.props;
        const hideEverything = classNames({'hidden': !this.props.activated});
        const hideMiniEditor = classNames({'hidden': !this.props.miniEditor.activate});
        const hideBody = classNames({'hidden': this.props.miniEditor.activate});
        return (
            <section className={hideEverything}>
                <header id="agda-header" className="panel-heading">
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
                <section className="panel-body">
                    <MiniEditor
                        className={hideMiniEditor}
                        placeholder={this.props.miniEditor.placeholder}
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
                    <Body
                        className={hideBody}
                        jumpToGoal={jumpToGoal}
                        jumpToLocation={jumpToLocation}
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
