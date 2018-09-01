import * as React from 'react';
import { Agda } from './../../../../../type';
import * as TC from './../../../../../type/agda/typeChecking';
import { intersperse } from './../../../../../util';

import { Comparison } from '../TypeChecking';
import { QName } from '../Syntax/Concrete';
import { Term, Type } from '../Syntax/Internal';

var Range = require('./../Syntax/Position.bs').jsComponent;


interface Props {
    error: TC.TypeError;
    range: Agda.Syntax.Position.Range;
    call: TC.Closure<TC.Call>;
    emacsMessage: string;
}

function notInScope(error: TC.TypeError_NotInScope): JSX.Element {

    const suggest = (suggestions) => suggestions.length ? (<span> (did you mean {
        intersperse(suggestions.map((name, i) =><QName key={i} value={name} />), ', ')
    } ?)</span>) : null;

    const item = ({ name, suggestions }, i) => <li key={i}>
        <QName value={name} />{suggest(suggestions)}
    </li>

    return <section>
        The following identifiers are not in scope: <br/>
        <ul>
            {error.payloads.map(item)}
        </ul>
    </section>
}

function unequalTerms(error: TC.TypeError_UnequalTerms): JSX.Element {
    return <section>
        {'expected : '}<Term value={error.term2} /><br />
        {'  actual : '}<Term value={error.term1} /><br />
        {' of type : '}<Type value={error.type} /><br />
        when checking that the expression
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
            case 'UnequalTerms': return <div className="error">
                <Range range={range} /><br/>
                {unequalTerms(error)}
            </div>
            default: return <p className="error">
                {emacsMessage}
            </p>
        }
    }
}
