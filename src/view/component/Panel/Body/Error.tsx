import * as React from 'react';
import { inspect } from 'util';
import { EventEmitter } from 'events';
import { Agda } from './../../../../type';

import TypeError from './TypeError';

interface Props {
    error: Agda.Error;
    emitter: EventEmitter;
}

export default class Error extends React.Component<Props, {}> {
    render() {
        const { emitter , error } = this.props;
        switch (error.kind) {
            case 'TypeError': return <TypeError
                    emitter={emitter}
                    error={error.typeError}
                />
            case 'Exception': return <p className="error">
                    {JSON.stringify(error.range)}<br/>
                </p>
            case 'IOException': return <p className="error">
                    {JSON.stringify(error.range)}<br/>
                </p>
            case 'PatternError': return <p className="error">
                    Pattern violation (you shouldn't see this)
                </p>
        }
        //     case 'BadConstructor': return <p className="error">
        //             <Location emitter={emitter}>{error.location}</Location><br/>
        //             The constructor <Expr emitter={emitter}>{error.constructor}</Expr><br/>
        //             does not construct an element of <Expr emitter={emitter}>{error.constructorType}</Expr><br/>
        //             when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
        //             has type <Expr emitter={emitter}>{error.exprType}</Expr>
        //     </p>
    }
}
