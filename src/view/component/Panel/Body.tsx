import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { EventEmitter } from 'events';

import { View } from '../../../type';
import { updateMaxBodyHeight, EVENT } from '../../actions';
import Expr from './Body/Expr';
import EmacsError from './Body/EmacsError';
import Error from './Body/Error';
import Location from './Body/Location';
import Solution from './Body/Solution';

type OwnProps = React.HTMLProps<HTMLElement> & {
    emitter: EventEmitter;
}

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
        const { emitter, body, solutions, error, emacsError, plainText, maxBodyHeight, mountAtBottom } = this.props;
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
                <ul className="list-group">
                    {body.goalAndHave.map(goalAndHave(emitter))}
                </ul>
                <ul className="list-group">
                    {body.goals.map(goal(emitter))}
                    {body.judgements.map(judgement(emitter))}
                    {body.terms.map(term(emitter))}
                    {body.metas.map(meta(emitter))}
                    {body.sorts.map(sort(emitter))}
                </ul>
                <ul className="list-group">
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
                {solutions.message &&
                    <Solution
                        emitter={emitter}
                        solutions={solutions}
                    />
                }
                {error && <Error emitter={emitter} error={error}/>}
                {emacsError && <EmacsError emitter={emitter}>{emacsError}</EmacsError>}
                {plainText && <p>{plainText}</p>}
            </section>
        )
    }
}

const goalAndHave = (emitter: EventEmitter) => (item: View.GoalAndHave, i: number): JSX.Element =>
    <li className="list-item special-item" key={i}>
        <div className="item-heading text-info">{item.label}</div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr emitter={emitter}>{item.type}</Expr>
        </div>
    </li>

const goal = (emitter: EventEmitter) => (item: View.Goal, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <button className="no-btn text-info" onClick={() => {
                const index = parseInt(item.index.substr(1));
                emitter.emit(EVENT.JUMP_TO_GOAL, index);
            }}>{item.index}</button>
        </div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr emitter={emitter}>{item.type}</Expr>
        </div>
    </li>

const judgement = (emitter: EventEmitter) => (item: View.Judgement, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <span className="text-success">{item.expr}</span>
        </div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr emitter={emitter}>{item.type}</Expr>
        </div>
    </li>

const term = (emitter: EventEmitter) => (item: View.Term, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-body">
            <Expr emitter={emitter}>{item.expr}</Expr>
        </div>
    </li>
const meta = (emitter: EventEmitter) => (item: View.Meta, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <span className="text-success">{item.index}</span>
        </div>
        <div className="item-colon"><span> : </span></div>
        <div className="item-body">
            <Expr emitter={emitter}>{item.type}</Expr>
            <Location abbr emitter={emitter}>{item.location}</Location>
        </div>
    </li>
const sort = (emitter: EventEmitter) => (item: View.Sort, i: number): JSX.Element =>
    <li className="list-item body-item" key={i}>
        <div className="item-heading">
            <span className="text-highlight">Sort </span>
            <span className="text-warning">{item.index}</span>
        </div>
        <div className="item-body">
            <Location abbr emitter={emitter}>{item.location}</Location>
        </div>
    </li>

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Body);
