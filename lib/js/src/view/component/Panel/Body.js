"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const view_1 = require("../../../view");
const actions_1 = require("../../actions");
var Error = require('./../../../Reason/View/TypeChecking/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/TypeChecking/AllGoalsWarnings.bs').jsComponent;
var EmacsBody = require('./../../../Reason/View/Emacs/EmacsBody.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../../../Reason/View/Syntax/Range.bs');
function mapStateToProps(state) {
    return Object.assign({ mountAtBottom: state.view.mountAt.current === 1 /* Bottom */, emacs: state.emacs }, state.body);
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
        const { useJSON, emacs, raw, allGoalsWarnings, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        if (useJSON) {
            return (React.createElement("section", { className: classes, tabIndex: -1, style: style },
                error &&
                    React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(Error, { error: error, emacsMessage: raw, emit: (ev, range) => {
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
                plainText && React.createElement("p", null, plainText)));
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
//# sourceMappingURL=Body.js.map