import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../../type';
import V from '../../../view';
import { updateMaxBodyHeight, EVENT } from '../../actions';
import Expr from './Body/Expr';
import EmacsError from './Body/EmacsError';
import Solution from './Body/Solution';

var Error = require('./../Reason/Error.bs').jsComponent;
var { toAtomRange, toAtomFilepath } = require('./../Reason/Range.bs');


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
        const { body, solutions, error, emacsMessage, emacsError, plainText, maxBodyHeight, mountAtBottom } = this.props;
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
                {body &&
                    <div>
                        <ul className="list-group body-legacy">
                            {body.goalAndHave.map(goalAndHave)}
                        </ul>
                        <ul className="list-group body-legacy">
                            {body.goals.map(goal)}
                            {body.judgements.map(judgement)}
                            {body.terms.map(term)}
                            {body.metas.map(meta)}
                            {body.sorts.map(sort)}
                        </ul>
                        <ul className="list-group body-legacy">
                            {body.warnings.length > 0 &&
                                <li className="list-item special-item">
                                    {body.warnings.join('\n')}
                                </li>
                            }
                            {body.errors.length > 0 &&
                                <li className="list-item special-item">
                                    {body.errors.join('\n')}
                                </li>
                            }
                        </ul>
                    </div>
                }
                {solutions.message &&
                    <Solution solutions={solutions} />
                }
                {error &&
                    <V.EventContext.Consumer>{emitter => (
                        <Error error={error} emacsMessage={emacsMessage} emit={(ev, range) => {
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
                {emacsError && <EmacsError>{emacsError}</EmacsError>}
                {plainText && <p>{plainText}</p>}
            </section>
        )
    }
}

const goalAndHave = (item: View.GoalAndHave, i: number): JSX.Element =>
    <li className="list-item special-item" key={i}>
        <div className="item-heading text-info">{item.label}</div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr>{item.type}</Expr>
        </div>
    </li>

const goal = (item: View.Goal, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <V.EventContext.Consumer>{emitter => (
                <button className="no-btn text-info" onClick={() => {
                    const index = parseInt(item.index.substr(1));
                    emitter.emit(EVENT.JUMP_TO_GOAL, index);
                }}>{item.index}</button>
            )}</V.EventContext.Consumer>
        </div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr>{item.type}</Expr>
        </div>
    </li>

const judgement = (item: View.Judgement, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <span className="text-success">{item.expr}</span>
        </div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr>{item.type}</Expr>
        </div>
    </li>

const term = (item: View.Term, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-body">
            <Expr>{item.expr}</Expr>
        </div>
    </li>
const meta = (item: View.Meta, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <span className="text-success">{item.index}</span>
        </div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr>{item.type}</Expr>
        </div>
    </li>
    // <Range abbr range={item.range} />
const sort = (item: View.Sort, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <span className="text-highlight">Sort </span>
            <span className="text-warning">{item.index}</span>
        </div>
        <div className="item-body">
        </div>
    </li>

    // <Range abbr range={item.range} />
export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
