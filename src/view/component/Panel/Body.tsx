import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../../type';
import V from '../../../view';
import { updateMaxBodyHeight, EVENT } from '../../actions';
import EmacsError from './EmacsMetas/EmacsError';
import Solution from './EmacsMetas/Solution';

var Error = require('./../../../Reason/View/TypeChecking/Error.bs').jsComponent;
var AllGoalsWarnings = require('./../../../Reason/View/TypeChecking/AllGoalsWarnings.bs').jsComponent;
var EmacsAllGoalsWarnings = require('./../../../Reason/View/TypeChecking/Emacs/EmacsAllGoalsWarnings.bs').jsComponent;
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
        const { emacs, allGoalsWarnings, solutions, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
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

                {solutions.message &&
                    <Solution solutions={solutions} />
                }
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
                {emacs.error && <EmacsError>{emacs.error}</EmacsError>}
                {plainText && <p>{plainText}</p>}
            </section>
        )
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
export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
