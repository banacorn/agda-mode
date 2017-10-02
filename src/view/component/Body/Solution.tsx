import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { EventEmitter } from 'events';

declare var atom: any;

import { View } from '../../../type';
// import { updateMaxBodyHeight, EVENT } from '../actions';
import Expr from './../Expr';
// import Error from './Error';
// import Location from './Location';
//
interface Props {
    solutions: View.Solutions;
    emitter: EventEmitter;
}

class Solution extends React.Component<Props, {}> {
    render() {
        // console.log(this.props.children)
        // console.log(this.props)
        const s = this.props.solutions;
        if (s.kind === 'SimpleSolutions') {
            return (
                <section>
                    <p>{s.message}</p>
                    <ul className="list-group">
                        {s.solutions.map(({ index, expr }, i) =>
                            <li className="list-item body-item" key={i}>
                                <div className="item-heading text-success">{index}</div>
                                <div className="item-colon"><span> </span></div>
                                <div className="item-body">
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
                            <li className="list-item special-item" key={i}>
                                <div className="item-heading text-info">{index}</div>
                                <div className="item-colon"><span> </span></div>
                                <div className="item-body">
                                    {JSON.stringify(combination)}
                                </div>
                            </li>
                        )}
                    </ul>
                </section>
            )
        }
    }
}

export default Solution;
