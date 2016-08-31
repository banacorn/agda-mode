import * as React from 'react';
import * as Promise from 'bluebird';
// import * as classNames from 'classnames';

import { View } from '../types';

interface TermProps extends React.HTMLAttributes {
    kind: 'unmarked' | 'goal' | 'meta' | 'sort'
}

class Term extends React.Component<TermProps, void> {
    render() {
        switch (this.props.kind) {
            case 'unmarked': return <span className="text-highlight">{this.props.children}</span>
            case 'goal': return <button className="no-btn text-info">{this.props.children}</button>
            case 'meta': return <span className="text-highlight">{this.props.children}</span>
            case 'sort': return <span className="text-highlight">{this.props.children}</span>
        }
    }
}

class Expr extends React.Component<React.HTMLAttributes, void> {
    render() {
        let expressions;
        if (typeof this.props.children === 'string') {
            //                                         1       2                3
            const tokens = this.props.children.split(/(\?\d+)|(\_[^\.]\S*)|Set (\_\S+)/g);
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
            <span className="expr" {...this.props} >{expressions.map((expr, i) =>
                <Term kind={expr.kind} key={i}>{expr.payload}</Term>
            )}</span>
        )
    }
}

export default Expr;
