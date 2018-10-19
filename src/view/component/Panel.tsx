import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import * as Action from '../actions';
import { Core } from '../../core';
import InputMethod from './Panel/InputMethod';
import SizingHandle from './Panel/SizingHandle';
import { View } from '../../type';
import V from '../../view';
import { MODE, updateMaxBodyHeight, QUERY, EVENT } from './../actions';


function toStyle(type: View.Style): string {
    switch (type) {
        case View.Style.Error:     return 'error';
        case View.Style.Warning:   return 'warning';
        case View.Style.Info:      return 'info';
        case View.Style.Success:   return 'success';
        case View.Style.PlainText: return 'plain-text';
        default:                  return '';
    }
}

var Dashboard = require('./../../Reason/View/Panel/Dashboard.bs').jsComponent;
var JSONBody = require('./../../Reason/View/Panel/Body.bs').jsComponent;
var MiniEditor = require('./../../Reason/View/MiniEditor.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../Reason/View/Range.bs');

//
type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = View.State & {
    headerText: string;
    style: View.Style;

    inputMethodActivated: boolean;

    mountAt: {
        previous: View.MountingPosition,
        current: View.MountingPosition
    };
    settingsView: boolean;
    pending: boolean;
};
type DispatchProps = {
    onMaxBodyHeightChange: (count: number) => void;
    deactivateMiniEditor: () => void;
    onResize: (offset: number) => void;
    handelQueryValueChange: (value: string) => void;
    //
    handleMountAtPane: () => void
    handleMountAtBottom: () => void;
    handleToggleSettingsView: () => void;
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        headerText: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated,

        mountAt: state.view.mountAt,
        settingsView: state.view.settingsView,
        pending: state.protocol.pending,
        ...state,
    }
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        onMaxBodyHeightChange: (count: number) => {
            dispatch(updateMaxBodyHeight(count));
        },
        deactivateMiniEditor: () => {
            dispatch(MODE.display());
        },
        onResize: (offset: number) => {
            dispatch(updateMaxBodyHeight(offset));
        },
        handelQueryValueChange: (value: string) => {
            dispatch(QUERY.updateValue(value));
        },
        //
        handleMountAtPane: () => {
            dispatch(Action.VIEW.mountAtPane());
        },
        handleMountAtBottom: () => {
            dispatch(Action.VIEW.mountAtBottom());
        },
        handleToggleSettingsView: () => {
            dispatch(Action.VIEW.toggleSettings());
        }
    };
}

class Panel extends React.Component<Props, {}> {

    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        })
    }

    render() {
        const { core, mode, body, onResize, mountAt, pending, settingsView, headerText, style, inputMethodActivated } = this.props;
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
                    <Dashboard
                        header={headerText}
                        style={toStyle(style)}
                        hidden={inputMethodActivated || _.isEmpty(headerText)}
                        isPending={pending}
                        mountAt={mountAt.current === View.MountingPosition.Bottom ? 'bottom' : 'pane'}
                        onMountChange={(at) => {
                            core.view.toggleDocking();
                            if (at === "bottom") {
                                this.props.handleMountAtBottom();
                            } else {
                                this.props.handleMountAtPane();
                            }
                        }}
                        settingsViewOn={settingsView}
                        onSettingsViewToggle={(isActivated) => {
                            this.props.handleToggleSettingsView();
                            if (isActivated) {
                                core.view.tabs.open('settings');
                            } else {
                                core.view.tabs.close('settings');
                            }
                        }}
                    />
                </section>
                <section className='agda-body-container'>
                    <V.EventContext.Consumer>{emitter => (
                        <JSONBody
                            raw={body.json}
                            emacs={body.emacs}
                            maxBodyHeight={body.maxBodyHeight}
                            useJSON={core.connection.usesJSON()}
                            hidden={View.Mode.Display !== mode}
                            mountAtBottom={mountAt.current === View.MountingPosition.Bottom}
                            emit={(ev, range) => {
                                switch (ev) {
                                    case EVENT.JUMP_TO_RANGE:
                                        emitter.emit(EVENT.JUMP_TO_RANGE, toAtomRange(range), toAtomFilepath(range));
                                        break;
                                    case EVENT.MOUSE_OUT:
                                        emitter.emit(EVENT.MOUSE_OUT, toAtomRange(range), toAtomFilepath(range));
                                        break;
                                    case EVENT.MOUSE_OVER:
                                        emitter.emit(EVENT.MOUSE_OVER, toAtomRange(range), toAtomFilepath(range));
                                        break;
                                }
                            }}
                        />
                    )}</V.EventContext.Consumer>
                    <MiniEditor
                        hidden={View.Mode.Query !== mode}
                        value={this.props.query.value}
                        placeholder={this.props.query.placeholder}
                        grammar='agda'
                        editorRef={(editor) => {
                            core.view.editors.general.resolve(editor);
                        }}
                        onFocus={() => {
                            core.view.editors.setFocus('general');
                        }}
                        onBlur={() => {
                            core.view.editors.setFocus('main');
                        }}
                        onConfirm={(result) => {
                            core.view.editors.answerGeneral(result);

                            this.props.handelQueryValueChange(result);
                            core.view.editors.focusMain();
                            this.props.deactivateMiniEditor();
                            core.inputMethod.confirm();
                        }}
                        onCancel={() => {
                            core.view.editors.rejectGeneral();

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
