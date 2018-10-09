"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const view_1 = require("../../../view");
const actions_1 = require("../../actions");
const EmacsError_1 = require("./EmacsMetas/EmacsError");
var Error = require('./../../../Reason/View/TypeChecking/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/TypeChecking/AllGoalsWarnings.bs').jsComponent;
var EmacsAllGoalsWarnings = require('./../../../Reason/View/TypeChecking/Emacs/EmacsAllGoalsWarnings.bs').jsComponent;
var EmacsGoalTypeContext = require('./../../../Reason/View/TypeChecking/Emacs/EmacsGoalTypeContext.bs').jsComponent;
var EmacsConstraints = require('./../../../Reason/View/TypeChecking/Emacs/EmacsConstraints.bs').jsComponent;
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
        const { emacs, allGoalsWarnings, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        return (React.createElement("section", { className: classes, tabIndex: -1, style: style },
            allGoalsWarnings &&
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(AllGoalsWarnings, { allGoalsWarnings: allGoalsWarnings, emit: (ev, range) => {
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
                    } }))),
            emacs.allGoalsWarnings &&
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(EmacsAllGoalsWarnings, { header: emacs.allGoalsWarnings[0], allGoalsWarnings: emacs.allGoalsWarnings[1], emit: (ev, range) => {
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
                    } }))),
            emacs.goalTypeContext &&
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(EmacsGoalTypeContext, { goalTypeContext: emacs.goalTypeContext, emit: (ev, range) => {
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
                    } }))),
            emacs.constraints &&
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(EmacsConstraints, { constraints: emacs.constraints, emit: (ev, range) => {
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
                    } }))),
            emacs.solutions &&
                React.createElement("section", { className: "metas" },
                    React.createElement("p", null,
                        " ",
                        emacs.solutions,
                        " ")),
            emacs.error && React.createElement(EmacsError_1.default, null, emacs.error),
            error &&
                React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(Error, { error: error, emacsMessage: emacs.message, emit: (ev, range) => {
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
                    } }))),
            plainText && React.createElement("p", null, plainText)));
    }
}
// <Range abbr range={item.range} />
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
//# sourceMappingURL=Body.js.map