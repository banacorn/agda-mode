import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { EventEmitter } from 'events';

declare var atom: any;

import Core from '../../core';
import InputMethod from './InputMethod';
import Header from './Header';
import Body from './Body';
import SizingHandle from './SizingHandle';
import { View, Location } from '../../types';
import MiniEditor from './MiniEditor';
import { deactivateMiniEditor, updateMaxBodyHeight } from './../actions';

interface Props extends View.State {
    core: Core;
    emitter: EventEmitter;
    onMiniEditorMount: (editor: MiniEditor) => void;
    deactivateMiniEditor: () => void;
    onResize: (offset: number) => void;
    mountAtPane: () => void;
    mountAtBottom: () => void;
}

const mapStateToProps = (state : View.State) => state

const mapDispatchToProps = (dispatch: any) => ({
    deactivateMiniEditor: () => {
        dispatch(deactivateMiniEditor());
    },
    onResize: (offset: number) => {
        dispatch(updateMaxBodyHeight(offset));
    }
})


class Panel extends React.Component<Props, void> {
    render() {
        const { core, emitter, onMiniEditorMount, onResize } = this.props;
        const { mountAtPane, mountAtBottom } = this.props;
        const atBottom = this.props.view.mountAt.current === View.MountingPosition.Bottom
        const hideEverything = classNames({'hidden': !this.props.view.activated && this.props.view.mountAt.current === View.MountingPosition.Bottom});
        const hideMiniEditor = classNames({'hidden': !this.props.miniEditor.activate});
        const hideBody = classNames({'hidden': this.props.miniEditor.activate});
        return (
            <section className={hideEverything}>
                <header className="panel-heading agda-header-container">
                    <SizingHandle
                        onResize={(height) => {
                            onResize(height)
                        }}
                        onResizeEnd={() => {
                            atom.config.set('agda-mode.maxBodyHeight', this.props.body.maxBodyHeight);
                        }}
                        atBottom={atBottom}
                    />
                    <InputMethod
                        updateTranslation={(c) => core.inputMethod.replaceBuffer(c)}
                        insertCharacter={(c) => {
                            core.inputMethod.insertCharToBuffer(c);
                            atom.views.getView(core.view.getEditor()).focus();
                        }}
                        chooseSymbol={(c) => {
                            core.inputMethod.replaceBuffer(c);
                            core.inputMethod.deactivate();
                            atom.views.getView(core.view.getEditor()).focus();
                        }}
                    />
                    <Header
                        mountAtPane={mountAtPane}
                        mountAtBottom={mountAtBottom}
                    />
                </header>
                <section className="agda-body-container">
                    <MiniEditor
                        className={hideMiniEditor}
                        placeholder={this.props.miniEditor.placeholder}
                        ref={(ref) => {
                            if (ref) onMiniEditorMount(ref);
                        }}
                        onConfirm={() => {
                            atom.views.getView(core.view.getEditor()).focus()
                            this.props.deactivateMiniEditor();
                        }}
                        onCancel={() => {
                            atom.views.getView(core.view.getEditor()).focus()
                            this.props.deactivateMiniEditor();
                        }}
                    />
                    <Body
                        emitter={emitter}
                        className={hideBody}
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
