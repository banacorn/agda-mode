import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../../type';
import V from '../../../view';
import { updateMaxBodyHeight, EVENT } from '../../actions';
import EmacsError from './EmacsMetas/EmacsError';

var Error = require('./../../../Reason/View/TypeChecking/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/TypeChecking/AllGoalsWarnings.bs').jsComponent;
var EmacsAllGoalsWarnings = require('./../../../Reason/View/TypeChecking/Emacs/EmacsAllGoalsWarnings.bs').jsComponent;
var EmacsGoalTypeContext = require('./../../../Reason/View/TypeChecking/Emacs/EmacsGoalTypeContext.bs').jsComponent;
var EmacsConstraints = require('./../../../Reason/View/TypeChecking/Emacs/EmacsConstraints.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../../Reason/View/Syntax/Range.bs');


type OwnProps = React.HTMLProps<HTMLElement>

type InjProps = View.BodyState & {
    mountAtBottom: boolean
};
type DispatchProps = {
    onMaxBodyHeightChange: (count: number) => void;
};
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        mountAtBottom: state.view.mountAt.current === View.MountingPosition.Bottom,
        ...state.body
    }
}

const mapDispatchToProps = (dispatch) => ({
    onMaxBodyHeightChange: (count: number) => {
        dispatch(updateMaxBodyHeight(count));
    }
})

class Body extends React.Component<Props, {}> {
    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        })
    }

    render() {
        const { emacs, allGoalsWarnings, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        return (
            <section
                className={classes}
                tabIndex={-1}
                style={style}
            >
                {allGoalsWarnings &&
                    <V.EventContext.Consumer>{emitter => (
                        <AllGoalsWarnings allGoalsWarnings={allGoalsWarnings} emit={(ev, range) => {
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
                        }} />
                    )}</V.EventContext.Consumer>}

                {emacs.allGoalsWarnings &&
                    <V.EventContext.Consumer>{emitter => (
                        <EmacsAllGoalsWarnings header={emacs.allGoalsWarnings[0]} allGoalsWarnings={emacs.allGoalsWarnings[1]} emit={(ev, range) => {
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
                        }} />
                    )}</V.EventContext.Consumer>}

                {emacs.goalTypeContext &&
                    <V.EventContext.Consumer>{emitter => (
                        <EmacsGoalTypeContext goalTypeContext={emacs.goalTypeContext} emit={(ev, range) => {
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
                        }} />
                    )}</V.EventContext.Consumer>}

                {emacs.constraints &&
                    <V.EventContext.Consumer>{emitter => (
                        <EmacsConstraints constraints={emacs.constraints} emit={(ev, range) => {
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
                         }} />
                    )}</V.EventContext.Consumer>}
                {emacs.solutions &&
                      <section className="metas">
                        <p> {emacs.solutions} </p>
                      </section>
                }
                {emacs.error && <EmacsError>{emacs.error}</EmacsError>}
                {error &&
                    <V.EventContext.Consumer>{emitter => (
                        <Error error={error} emacsMessage={emacs.message} emit={(ev, range) => {
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
                        }} />
                    )}</V.EventContext.Consumer>}
                {plainText && <p>{plainText}</p>}
            </section>
        )
    }
}
    // <Range abbr range={item.range} />
export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
