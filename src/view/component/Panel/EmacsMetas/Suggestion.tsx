import * as _ from 'lodash';
import * as React from 'react';
import { EventEmitter } from 'events';

import Expr from './Expr';


class Suggestion extends React.Component<{}, {}> {
    render() {
        const lines = this.props.children as string[];
        switch (lines.length) {
            case 0: return null
            case 1: return <span>
                Did you mean: <Expr>{lines[0]}</Expr> ?
            </span>
            default:
                const otherSuggestions = _.tail(lines).map((line, i) => {
                    return (<span key={i}><br/>           or <Expr>{line}</Expr></span>);
                });
                return <span>
                    Did you mean: <Expr>{_.head(lines)}</Expr>
                    {otherSuggestions} ?
                </span>
        }
    }
}

export default Suggestion;
