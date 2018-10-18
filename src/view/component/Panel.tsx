import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { Core } from '../../core';
import InputMethod from './Panel/InputMethod';
import Header from './Panel/Header';
import SizingHandle from './Panel/SizingHandle';
import { View } from '../../type';
import V from '../../view';
import TSMiniEditor from './MiniEditor';
import { MODE, updateMaxBodyHeight, QUERY, EVENT } from './../actions';


var JSONBody = require('./../../Reason/View/JSON/Body.bs').jsComponent;
var MiniEditor = require('./../../Reason/View/JSON/MiniEditor.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../Reason/View/Syntax/Syntax__Range.bs');

//
type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = View.State & {
    mountAtBottom: boolean;
};
type DispatchProps = {
    onMaxBodyHeightChange: (count: number) => void;
    deactivateMiniEditor: () => void;
    onResize: (offset: number) => void;
    handelQueryValueChange: (value: string) => void;
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        mountAtBottom: state.view.mountAt.current === View.MountingPosition.Bottom,
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

    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        })
    }

    render() {
        const { core, mode, body, onResize, mountAtBottom } = this.props;
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
                    <V.EventContext.Consumer>{emitter => (
                        <JSONBody
                            raw={body.json}
                            emacs={body.emacs}
                            maxBodyHeight={body.maxBodyHeight}
                            useJSON={core.connection.usesJSON()}
                            hidden={View.Mode.Display !== mode}
                            mountAtBottom={mountAtBottom}
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



// <TSMiniEditor
//     className={show(View.Mode.Query, mode)}
//     value={this.props.query.value}
//     placeholder={this.props.query.placeholder}
//     data-grammar='agda'
//     ref={(ref) => {
//         if (ref)
//             core.view.editors.general.resolve(ref);
//     }}
//     onConfirm={(result) => {
//         this.props.handelQueryValueChange(result);
//         core.view.editors.focusMain()
//         this.props.deactivateMiniEditor();
//         core.inputMethod.confirm();
//     }}
//     onCancel={() => {
//         core.view.editors.focusMain()
//         this.props.deactivateMiniEditor();
//         core.inputMethod.cancel();
//     }}
// />
