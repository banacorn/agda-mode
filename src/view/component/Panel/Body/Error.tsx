import * as React from 'react';
import { Agda } from './../../../../type';

import TypeError from './TypeError';

interface Props {
    error: Agda.Error;
    emacsMessage: string;
}

export default class Error extends React.Component<Props, {}> {
    render() {
        const { error, emacsMessage } = this.props;
        switch (error.kind) {
            case 'TypeError': return <TypeError
                    error={error.typeError}
                    range={error.range}
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
