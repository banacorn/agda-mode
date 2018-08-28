import * as React from 'react';
import { inspect } from 'util';
import { EventEmitter } from 'events';
import { Agda } from './../../../../type';
import Range from './Range';

interface Props {
    error: Agda.TypeError;
    emitter: EventEmitter;
}

function notInScope(emitter: EventEmitter, error: Agda.TypeError_NotInScope): JSX.Element {
    return <p className="error">
            <Range emitter={emitter} range={error.payloads[0].range} /><br/>
            {JSON.stringify(error.payloads)}<br/>
        </p>
}

export default class TypeError extends React.Component<Props, {}> {
    render() {
        console.log(this.props.error)
        const { emitter , error } = this.props;
        switch (error.kind) {
            case 'NotInScope': return notInScope(emitter, error);
            default: return <p className="error">
                    Unhandled Error: <br/>
                    {JSON.stringify(error)}
                </p>
        }
    }
}
