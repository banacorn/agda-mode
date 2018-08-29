import * as React from 'react';
import { inspect } from 'util';
import { EventEmitter } from 'events';
import { Agda } from './../../../../type';
import Range from './Range';

interface Props {
    error: Agda.TypeError;
    range: Agda.Syntax.Range;
    emacsMessage: string;
    emitter: EventEmitter;
}

function notInScope(emitter: EventEmitter, error: Agda.TypeError_NotInScope): JSX.Element {
    return <section>
        The following identifiers are not in scope: <br/>
        <ul>
            {error.payloads.map(({ name, range, suggestions }, i) => <li key={i}>
                {JSON.stringify(name)} {JSON.stringify(range)} {JSON.stringify(suggestions)}
            </li>)}
        </ul>
    </section>
}

export default class TypeError extends React.Component<Props, {}> {
    render() {
        const { emitter, error, range, emacsMessage } = this.props;
        switch (error.kind) {
            case 'NotInScope': return <div className="error">
                <Range emitter={emitter} range={range} /><br/>
                {notInScope(emitter, error)}
            </div>
            default: return <p className="error">
                {emacsMessage}
            </p>
        }
    }
}
