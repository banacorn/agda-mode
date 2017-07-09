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
import { MODE, updateMaxBodyHeight } from './../actions';
import { NoConnectionGiven } from './../../connector';

//
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
            dispatch(MODE.display());
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
        let body;
        switch (this.props.mode) {
            case View.Mode.Display:
                body =
                    <Body
                        emitter={emitter}
                    />;
                break;
            case View.Mode.Query:
                body =
                    <MiniEditor
                        data-grammar="source agda"
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
                break;
            case View.Mode.InquireConnection:
                body =
                    <div>
                        <p>
                            Unable to find Agda on your machine, please enter the path of Agda manually.
                        </p>
                        <MiniEditor
                            onConfirm={(path) => {
                                core.view.connectionInquisitorTP.resolve(path);
                                atom.views.getView(core.view.getEditor()).focus()
                                this.props.deactivateMiniEditor();
                            }}
                            onCancel={() => {
                                core.view.connectionInquisitorTP.reject(new NoConnectionGiven);
                                atom.views.getView(core.view.getEditor()).focus()
                                this.props.deactivateMiniEditor();
                            }}
                        />
                    </div>
                break;

        }
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
                    {body}
                </section>
            </section>
        )
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Panel);
