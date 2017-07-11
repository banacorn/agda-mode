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
import { MODE, updateMaxBodyHeight, QUERY } from './../actions';
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
    handelQueryValueChange: (value: string) => void;
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
        },
        handelQueryValueChange: (value: string) => {
            dispatch(QUERY.updateValue(value));
        }
    };
}

function show(kind: View.Mode, mode: View.Mode, ...classes): string {
    return classNames({
        'hidden': kind !== mode,
        ...classes
    })
}

class Panel extends React.Component<Props, void> {
    render() {
        const { core, emitter, mode, onResize, handelQueryValueChange } = this.props;
        const atBottom = this.props.view.mountAt.current === View.MountingPosition.Bottom
        const hideEverything = classNames({'hidden': !this.props.view.activated && this.props.view.mountAt.current === View.MountingPosition.Bottom});
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
                    <Body
                        className={show(View.Mode.Display, mode)}
                        emitter={emitter}
                    />
                    <MiniEditor
                        className={show(View.Mode.Query, mode)}
                        value={this.props.query.value}
                        placeholder={this.props.query.placeholder}
                        data-grammar="source agda"
                        ref={(ref) => {
                            if (ref)
                                core.view.miniEditors.general = ref;
                        }}
                        onConfirm={(result) => {
                            this.props.handelQueryValueChange(result);
                            atom.views.getView(core.view.getEditor()).focus()
                            this.props.deactivateMiniEditor();
                        }}
                        onCancel={() => {
                            atom.views.getView(core.view.getEditor()).focus()
                            this.props.deactivateMiniEditor();
                        }}
                    />
                    <div
                        className={show(View.Mode.QueryConnection, mode)}
                    >
                        <p>
                            Unable to find Agda on your machine, please enter the path of Agda manually.
                        </p>
                        <MiniEditor
                            ref={(ref) => {
                                if (ref)
                                    core.view.miniEditors.connection = ref;
                            }}
                            onConfirm={(path) => {
                                atom.views.getView(core.view.getEditor()).focus()
                                this.props.deactivateMiniEditor();
                            }}
                            onCancel={() => {
                                atom.views.getView(core.view.getEditor()).focus()
                                this.props.deactivateMiniEditor();
                            }}
                        />
                    </div>
                </section>
            </section>
        )
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Panel);
