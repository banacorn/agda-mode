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
import { View, Location } from '../../type';
import MiniEditor from './MiniEditor';
import { MINI_EDITOR, updateMaxBodyHeight } from './../actions';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
    emitter: EventEmitter;
}
type InjProps = View.State;
type DispatchProps = {
    deactivateMiniEditor: () => void;
    onResize: (offset: number) => void;
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return state
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        deactivateMiniEditor: () => {
            dispatch(MINI_EDITOR.deactivate());
        },
        onResize: (offset: number) => {
            dispatch(updateMaxBodyHeight(offset));
        }
    };
}

class Panel extends React.Component<Props, void> {
    render() {
        const { core, emitter, onResize } = this.props;
        const atBottom = this.props.view.mountAt.current === View.MountingPosition.Bottom
        const hideEverything = classNames({'hidden': !this.props.view.activated && this.props.view.mountAt.current === View.MountingPosition.Bottom});
        const hideMiniEditor = classNames({'hidden': !this.props.miniEditor.activate});
        const hideBody = classNames({'hidden': this.props.miniEditor.activate});
        return (
            <section className={hideEverything}>
                <section className="panel-heading agda-header-container">
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
                        core={core}
                    />
                </section>
                <section className="agda-body-container">
                    <MiniEditor
                        className={hideMiniEditor}
                        placeholder={this.props.miniEditor.placeholder}
                        ref={(ref) => {
                            if (ref)
                                core.view.miniEditor = ref;
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

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Panel);
