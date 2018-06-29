import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { EventEmitter } from 'events';

import { Core } from '../../core';
import InputMethod from './Panel/InputMethod';
import Header from './Panel/Header';
import Body from './Panel/Body';
import SizingHandle from './Panel/SizingHandle';
import { View } from '../../type';
import MiniEditor from './MiniEditor';
import { MODE, updateMaxBodyHeight, QUERY } from './../actions';

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

class Panel extends React.Component<Props, {}> {
    render() {
        const { core, emitter, mode, onResize } = this.props;
        const atBottom = this.props.view.mountAt.current === View.MountingPosition.Bottom
        const hideEverything = classNames({'hidden': !this.props.view.activated && this.props.view.mountAt.current === View.MountingPosition.Bottom});
        return (
            <section className={hideEverything}>
                <section className='panel-heading agda-header-container'>
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
                            core.view.editors.focusMain()
                        }}
                        chooseSymbol={(c) => {
                            core.inputMethod.replaceBuffer(c);
                            core.inputMethod.deactivate();
                            core.view.editors.focusMain()
                        }}
                    />
                    <Header
                        core={core}
                    />
                </section>
                <section className='agda-body-container'>
                    <Body
                        className={show(View.Mode.Display, mode)}
                        emitter={emitter}
                    />
                    <MiniEditor
                        className={show(View.Mode.Query, mode)}
                        value={this.props.query.value}
                        placeholder={this.props.query.placeholder}
                        data-grammar='agda'
                        ref={(ref) => {
                            if (ref)
                                core.view.editors.general = ref;
                        }}
                        onConfirm={(result) => {
                            this.props.handelQueryValueChange(result);
                            core.view.editors.focusMain()
                            this.props.deactivateMiniEditor();
                            core.inputMethod.confirm();
                        }}
                        onCancel={() => {
                            core.view.editors.focusMain()
                            this.props.deactivateMiniEditor();
                            core.inputMethod.cancel();
                        }}
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

// <button className='btn icon icon-gear inline-block-tight'>Advenced Connection Settings</button>
