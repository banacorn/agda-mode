import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../../type';
import V from '../../../view';
import { updateMaxBodyHeight, EVENT } from '../../actions';

var Error = require('./../../../Reason/View/JSON/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/JSON/AllGoalsWarnings.bs').jsComponent;
var EmacsBody = require('./../../../Reason/View/Emacs/EmacsBody.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../../Reason/View/Syntax/Range.bs');


type OwnProps = React.HTMLProps<HTMLElement> & {
    useJSON: boolean;
}

type InjProps = View.BodyState & {
    mountAtBottom: boolean;
};
type DispatchProps = {
    onMaxBodyHeightChange: (count: number) => void;
};
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        mountAtBottom: state.view.mountAt.current === View.MountingPosition.Bottom,
        ...state.body,
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
        const { useJSON, emacs, raw, allGoalsWarnings, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};

        if (useJSON) {
            return (
                <section
                    className={classes}
                    tabIndex={-1}
                    style={style}
                >
                    {error &&
                        <V.EventContext.Consumer>{emitter => (
                            <Error error={error} emacsMessage={raw} emit={(ev, range) => {
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

                    {plainText && <p>{plainText}</p>}
                </section>
            )
        } else {
            return (
                <section
                    className={classes}
                    tabIndex={-1}
                    style={style}
                >
                    <V.EventContext.Consumer>{emitter => (
                        <EmacsBody raw={emacs} emit={(ev, range) => {
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
                    )}</V.EventContext.Consumer>
                </section>
            );
        }
    }
}
export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
