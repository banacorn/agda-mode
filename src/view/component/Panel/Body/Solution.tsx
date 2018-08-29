import * as React from 'react';
import { EventEmitter } from 'events';
import { EVENT } from '../../../actions';

import V from '../../../../view';
import { View } from '../../../../type';
import Expr from './Expr';

interface Props {
    solutions: View.Solutions;
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
                                <V.EventContext.Consumer>
                                    {emitter => (
                                        <button className="no-btn icon icon-check check-solutions text-subtle" onClick={() => {
                                            emitter.emit(EVENT.FILL_IN_SIMPLE_SOLUTION, expr);
                                        }}></button>
                                    )}
                                </V.EventContext.Consumer>
                                <div className="item-heading text-subtle">{index}.</div>
                                <div className="item-cell">
                                    <Expr>{expr}</Expr>
                                </div>
                            </li>
                        )}
                    </ul>
                </section>
            )
        } else {
            return (
                <V.EventContext.Consumer>
                    {emitter => (
                        <section>
                            <p>{s.message}</p>
                            <ul className="list-group">
                                {s.solutions.map(({ index, combination }, i) =>
                                    <li className="list-item" key={i}>
                                                <button className="no-btn icon icon-check check-solutions text-subtle" onClick={() => {
                                                    emitter.emit(EVENT.FILL_IN_INDEXED_SOLUTIONS, combination);
                                                }}></button>
                                        <div className="item-heading text-subtle">{index}.</div>
                                        {combination.map((solution, i) =>
                                            <div className="item-cell" key={i}>
                                                <button
                                                    className="no-btn text-info goal"
                                                    onClick={() => {
                                                        emitter.emit(EVENT.JUMP_TO_GOAL, solution.goalIndex);
                                                    }}
                                                >?{solution.goalIndex}</button>
                                                <div className="item-colon"><span> : </span></div>
                                                <Expr>{solution.expr}</Expr>
                                            </div>
                                        )}
                                    </li>
                                )}
                            </ul>
                        </section>
                    )}
                </V.EventContext.Consumer>
            )
        }
    }
}

export default Solution;
