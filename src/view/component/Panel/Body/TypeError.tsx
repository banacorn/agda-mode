import * as React from 'react';
import { Agda } from './../../../../type';
import { intersperse } from './../../../../util';

import Range from './Range';
import { QName } from './Syntax';


interface Props {
    error: Agda.TypeError;
    range: Agda.Syntax.Position.Range;
    emacsMessage: string;
}

function notInScope(error: Agda.TypeError_NotInScope): JSX.Element {

    const suggest = (suggestions) => suggestions.length ? (<span> (did you mean {
        intersperse(suggestions.map((name, i) =><QName key={i} names={name} />), ', ')
    } ?)</span>) : null;

    const item = ({ name, suggestions }, i) => <li key={i}>
        <QName names={name} />{suggest(suggestions)}
    </li>

    return <section>
        The following identifiers are not in scope: <br/>
        <ul>
            {error.payloads.map(item)}
        </ul>
    </section>
}


function unequalTerms(error: Agda.TypeError_NotInScope): JSX.Element {

    return <section>
    </section>
}
export default class TypeError extends React.Component<Props, {}> {
    render() {
        const { error, range, emacsMessage } = this.props;
        console.log(emacsMessage)
        console.log(error)

        switch (error.kind) {
            case 'NotInScope': return <div className="error">
                <Range range={range} /><br/>
                {notInScope(error)}
            </div>
            // case 'UnequalTerms': return <div className="error">
            //     <Range range={range} /><br/>
            //     {notInScope(error)}
            // </div>
            default: return <p className="error">
                {emacsMessage}
            </p>
        }
    }
}
