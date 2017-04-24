import * as _ from 'lodash';
import * as React from 'react';
import * as Promise from 'bluebird';
import { EventEmitter } from 'events';

import { View } from '../../type';
import { EVENT } from '../actions';

interface TermProps extends React.HTMLAttributes {
    jumpToGoal: (index: number) => void;
    kind: 'unmarked' | 'goal' | 'meta' | 'sort';
}

class Term extends React.Component<TermProps, void> {
    render() {
        const { jumpToGoal } = this.props;
        switch (this.props.kind) {
            case 'unmarked': return <span className="text-highlight">{this.props.children}</span>
            case 'goal': return <button className="no-btn text-info goal" onClick={() => {
                const index = parseInt(this.props.children.toString().substr(1));
                jumpToGoal(index);
            }}>{this.props.children}</button>
            case 'meta': return <span className="text-success meta">{this.props.children}</span>
            case 'sort': return <span className="text-warning sort">{this.props.children}</span>
        }
    }
}


interface ExprProps extends React.HTMLAttributes {
    emitter: EventEmitter
}

class Expr extends React.Component<ExprProps, void> {
    render() {
        const { emitter } = this.props;
        const otherProps = _.omit(this.props, 'jumpToGoal', 'emitter');
        let expressions;
        if (typeof this.props.children === 'string') {
            //                                         1       2                3
            const tokens = this.props.children.split(/(\?\d+)|(\_[^\.][^\}\)\s]*)|(Set \_\S+)/g);
            expressions = tokens.map((token, i) => {
                switch (i % 4) {
                    case 0: return {
                        kind: 'unmarked',
                        payload: token
                    }
                    case 1: return {
                        kind: 'goal',
                        payload: token
                    }
                    case 2: return {
                        kind: 'meta',
                        payload: token
                    }
                    case 3: return {
                        kind: 'sort',
                        payload: token
                    }
                }
            }).filter(token => !_.isEmpty(token.payload));

        } else {
            expressions = []
        }
        return (
            <span className="expr" {...otherProps} >{expressions.map((expr, i) =>
                <Term kind={expr.kind} key={i} jumpToGoal={(index) => {
                    emitter.emit(EVENT.JUMP_TO_GOAL, index);
                }}>{expr.payload}</Term>
            )}</span>
        )
    }
}

export default Expr;
