import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { EventEmitter } from 'events';
import { EVENT } from '../../actions';

import { View } from '../../../type';
import Expr from './../Expr';

interface Props {
    solutions: View.Solutions;
    emitter: EventEmitter;
}

class Solution extends React.Component<Props, {}> {
    render() {
        const s = this.props.solutions;
        if (s.kind === 'SimpleSolutions') {
            return (
                <section>
                    <p>{s.message}</p>
                    <ul className="list-group">
                        {s.solutions.map(({ index, expr }, i) =>
                            <li className="list-item" key={i}>
                                <button className="no-btn icon icon-check check-solutions text-subtle" onClick={() => {
                                    this.props.emitter.emit(EVENT.FILL_IN_SIMPLE_SOLUTION, expr);
                                }}></button>
                                <div className="item-heading text-subtle">{index}.</div>
                                <div className="item-cell">
                                    <Expr emitter={this.props.emitter}>{expr}</Expr>
                                </div>
                            </li>
                        )}
                    </ul>
                </section>
            )
        } else {
            return (
                <section>
                    <p>{s.message}</p>
                    <ul className="list-group">
                        {s.solutions.map(({ index, combination }, i) =>
                            <li className="list-item" key={i}>
                                <button className="no-btn icon icon-check check-solutions text-subtle" onClick={() => {
                                    this.props.emitter.emit(EVENT.FILL_IN_INDEXED_SOLUTIONS, combination);
                                }}></button>
                                <div className="item-heading text-subtle">{index}.</div>
                                {combination.map((solution, i) =>
                                    <div className="item-cell" key={i}>
                                        <button
                                            className="no-btn text-info goal"
                                            onClick={() => {
                                                this.props.emitter.emit(EVENT.JUMP_TO_GOAL, solution.goalIndex);
                                            }}
                                        >?{solution.goalIndex}</button>
                                        <div className="item-colon"><span> : </span></div>
                                        <Expr emitter={this.props.emitter}>{solution.expr}</Expr>
                                    </div>
                                )}
                            </li>
                        )}
                    </ul>
                </section>
            )
        }
    }
}

export default Solution;
