"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const view_1 = require("../../../view");
const actions_1 = require("../../actions");
const EmacsError_1 = require("./EmacsMetas/EmacsError");
const Solution_1 = require("./EmacsMetas/Solution");
var Error = require('./../../../Reason/View/TypeChecking/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/TypeChecking/AllGoalsWarnings.bs').jsComponent;
var EmacsAllGoalsWarnings = require('./../../../Reason/View/TypeChecking/Emacs/EmacsAllGoalsWarnings.bs').jsComponent;
var EmacsGoalTypeContext = require('./../../../Reason/View/TypeChecking/Emacs/EmacsGoalTypeContext.bs').jsComponent;
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
        const { emacs, allGoalsWarnings, solutions, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
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
            solutions.message &&
                React.createElement(Solution_1.default, { solutions: solutions }),
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
            emacs.error && React.createElement(EmacsError_1.default, null, emacs.error),
            plainText && React.createElement("p", null, plainText)));
    }
}
// {emacsMetas &&
//     <div>
//         {emacsMetas.goalAndHave && goalAndHave(emacsMetas.goalAndHave)}
//         <ul className="list-group body-legacy">
//             {emacsMetas.goals.map(goal)}
//             {emacsMetas.judgements.map(judgement)}
//             {emacsMetas.terms.map(term)}
//             {emacsMetas.metas.map(meta)}
//             {emacsMetas.sorts.map(sort)}
//         </ul>
//         <ul className="list-group body-legacy">
//             {emacsMetas.warnings.length > 0 &&
//                 <li className="list-item special-item">
//                     {emacsMetas.warnings.join('\n')}
//                 </li>
//             }
//             {emacsMetas.errors.length > 0 &&
//                 <li className="list-item special-item">
//                     {emacsMetas.errors.join('\n')}
//                 </li>
//             }
//         </ul>
//     </div>
// }
//
// const goalAndHave = ({goal, have}: View.GoalAndHave): JSX.Element =>
//     <ul className="list-group body-legacy">
//         <li className="list-item special-item">
//             <div className="item-heading text-info">Goal</div>
//             <div className="item-colon"><span> : </span></div>
//             <div className="item-body">
//                 <Expr>{goal}</Expr>
//             </div>
//         </li>
//         { have && (
//             <li className="list-item special-item">
//                 <div className="item-heading text-info">Have</div>
//                 <div className="item-colon"><span> : </span></div>
//                 <div className="item-body">
//                     <Expr>{have}</Expr>
//                 </div>
//             </li>
//         )}
//     </ul>
//
// const goal = (item: View.Goal, i: number): JSX.Element =>
//     <li className="list-item body-item" key={i}>
//         <div className="item-heading">
//             <V.EventContext.Consumer>{emitter => (
//                 <button className="no-btn text-info" onClick={() => {
//                     const index = parseInt(item.index.substr(1));
//                     emitter.emit(EVENT.JUMP_TO_GOAL, index);
//                 }}>{item.index}</button>
//             )}</V.EventContext.Consumer>
//         </div>
//         <div className="item-colon"><span> : </span></div>
//         <div className="item-body">
//             <Expr>{item.type}</Expr>
//         </div>
//     </li>
//
// const judgement = (item: View.Judgement, i: number): JSX.Element =>
//     <li className="list-item body-item" key={i}>
//         <div className="item-heading">
//             <span className="text-success">{item.expr}</span>
//         </div>
//         <div className="item-colon"><span> : </span></div>
//         <div className="item-body">
//             <Expr>{item.type}</Expr>
//         </div>
//     </li>
//
// const term = (item: View.Term, i: number): JSX.Element =>
//     <li className="list-item body-item" key={i}>
//         <div className="item-body">
//             <Expr>{item.expr}</Expr>
//         </div>
//     </li>
// const meta = (item: View.Meta, i: number): JSX.Element =>
//     <li className="list-item body-item" key={i}>
//         <div className="item-heading">
//             <span className="text-success">{item.index}</span>
//         </div>
//         <div className="item-colon"><span> : </span></div>
//         <div className="item-body">
//             <Expr>{item.type}</Expr>
//         </div>
//     </li>
//     // <Range abbr range={item.range} />
// const sort = (item: View.Sort, i: number): JSX.Element =>
//     <li className="list-item body-item" key={i}>
//         <div className="item-heading">
//             <span className="text-highlight">Sort </span>
//             <span className="text-warning">{item.index}</span>
//         </div>
//         <div className="item-body">
//         </div>
//     </li>
// <Range abbr range={item.range} />
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
//# sourceMappingURL=Body.js.map