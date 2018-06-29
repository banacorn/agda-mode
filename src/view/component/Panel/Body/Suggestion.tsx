import * as _ from 'lodash';
import * as React from 'react';
import { EventEmitter } from 'events';

import Expr from './Expr';

type Props = React.HTMLProps<HTMLElement> & {
    emitter: EventEmitter;
};

class Suggestion extends React.Component<Props, {}> {
    render() {
        const { emitter } = this.props;
        const lines = this.props.children as string[];
        switch (lines.length) {
            case 0: return null
            case 1: return <span>
                Did you mean: <Expr emitter={emitter}>{lines[0]}</Expr> ?
            </span>
            default:
                const otherSuggestions = _.tail(lines).map((line, i) => {
                    return (<span key={i}><br/>           or <Expr emitter={emitter}>{line}</Expr></span>);
                });
                return <span>
                    Did you mean: <Expr emitter={emitter}>{_.head(lines)}</Expr>
                    {otherSuggestions} ?
                </span>
        }
    }
}

export default Suggestion;
