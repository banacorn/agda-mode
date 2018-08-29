import * as React from 'react';
import { Agda } from './../../../../type';

import Range from './Range';
import { QName } from './Syntax';


interface Props {
    error: Agda.TypeError;
    range: Agda.Syntax.Range;
    emacsMessage: string;
}

function notInScope(error: Agda.TypeError_NotInScope): JSX.Element {
    return <section>
        The following identifiers are not in scope: <br/>
        <ul>
            {error.payloads.map(({ name, suggestions }, i) => <li key={i}>
                <QName names={name} />
                <ul>
                    {suggestions.map((name, i) => <QName key={i} names={name} />)}
                </ul>
            </li>)}
        </ul>
    </section>
}

export default class TypeError extends React.Component<Props, {}> {
    render() {
        const { error, range, emacsMessage } = this.props;
        switch (error.kind) {
            case 'NotInScope': return <div className="error">
                <Range range={range} /><br/>
                {notInScope(error)}
            </div>
            default: return <p className="error">
                {emacsMessage}
            </p>
        }
    }
}
