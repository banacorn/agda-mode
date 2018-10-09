"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const view_1 = require("../../../view");
const actions_1 = require("../../actions");
var Error = require('./../../../Reason/View/JSON/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/JSON/AllGoalsWarnings.bs').jsComponent;
var EmacsBody = require('./../../../Reason/View/Emacs/EmacsBody.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../../Reason/View/Syntax/Range.bs');
function mapStateToProps(state) {
    return Object.assign({ mountAtBottom: state.view.mountAt.current === 1 /* Bottom */ }, state.body);
}
const mapDispatchToProps = (dispatch) => ({
    onMaxBodyHeightChange: (count) => {
        dispatch(actions_1.updateMaxBodyHeight(count));
    }
});
class Body extends React.Component {
    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        });
    }
    render() {
        const { useJSON, emacs, json, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        if (useJSON) {
            return (React.createElement("section", { className: classes, tabIndex: -1, style: style }));
        }
        else {
            return (React.createElement("section", { className: classes, tabIndex: -1, style: style },
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(EmacsBody, { raw: emacs, emit: (ev, range) => {
                        switch (ev) {
                            case actions_1.EVENT.JUMP_TO_RANGE:
                                emitter.emit(actions_1.EVENT.JUMP_TO_RANGE, toAtomRange(range), toAtomFilepath(range));
                                break;
                            case actions_1.EVENT.MOUSE_OUT:
                                emitter.emit(actions_1.EVENT.MOUSE_OUT, toAtomRange(range), toAtomFilepath(range));
                                break;
                            case actions_1.EVENT.MOUSE_OVER:
                                emitter.emit(actions_1.EVENT.MOUSE_OVER, toAtomRange(range), toAtomFilepath(range));
                                break;
                        }
                    } })))));
        }
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
// {error &&
//     <V.EventContext.Consumer>{emitter => (
//         <Error error={error} emacsMessage={raw} emit={(ev, range) => {
//             switch (ev) {
//                 case EVENT.JUMP_TO_RANGE:
//                     emitter.emit(EVENT.JUMP_TO_RANGE, toAtomRange(range), toAtomFilepath(range));
//                     break;
//                 case EVENT.MOUSE_OUT:
//                     emitter.emit(EVENT.MOUSE_OUT, toAtomRange(range), toAtomFilepath(range));
//                     break;
//                 case EVENT.MOUSE_OVER:
//                     emitter.emit(EVENT.MOUSE_OVER, toAtomRange(range), toAtomFilepath(range));
//                     break;
//             }
//         }} />
//     )}</V.EventContext.Consumer>}
//
// {allGoalsWarnings &&
//     <V.EventContext.Consumer>{emitter => (
//         <AllGoalsWarnings allGoalsWarnings={allGoalsWarnings} emit={(ev, range) => {
//             switch (ev) {
//                 case EVENT.JUMP_TO_RANGE:
//                     emitter.emit(EVENT.JUMP_TO_RANGE, toAtomRange(range), toAtomFilepath(range));
//                     break;
//                 case EVENT.MOUSE_OUT:
//                     emitter.emit(EVENT.MOUSE_OUT, toAtomRange(range), toAtomFilepath(range));
//                     break;
//                 case EVENT.MOUSE_OVER:
//                     emitter.emit(EVENT.MOUSE_OVER, toAtomRange(range), toAtomFilepath(range));
//                     break;
//             }
//         }} />
//     )}</V.EventContext.Consumer>}
//
// {plainText && <p>{plainText}</p>}
//# sourceMappingURL=Body.js.map