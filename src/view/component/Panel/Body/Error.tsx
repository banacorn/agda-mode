import * as React from 'react';
import { inspect } from 'util';
import { EventEmitter } from 'events';
import { Agda } from './../../../../type';

import TypeError from './TypeError';

interface Props {
    error: Agda.Error;
    emacsMessage: string;
    emitter: EventEmitter;
}

export default class Error extends React.Component<Props, {}> {
    render() {
        const { emitter , error, emacsMessage } = this.props;
        switch (error.kind) {
            case 'TypeError': return <TypeError
                    emitter={emitter}
                    error={error.typeError}
                    emacsMessage={emacsMessage}
                />
            case 'Exception': return <p className="error">
                    {emacsMessage}<br/>
                </p>
            case 'IOException': return <p className="error">
                    {emacsMessage}<br/>
                </p>
            case 'PatternError': return <p className="error">
                    Pattern violation (you shouldn't see this)
                </p>
        }
    }
}
