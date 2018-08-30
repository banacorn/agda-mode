import * as _ from 'lodash';
import * as React from 'react';
import { EventEmitter } from 'events';
import { Agda } from './../../../../type';
import { intersperse } from './../../../../util';


import Link from './Link'

////////////////////////////////////////////////////////////////////////////////
// Misc

export const Comparison = (props) => props.value === 'CmpEq'
    ? <span>=</span>
    : <span>≤</span>;

////////////////////////////////////////////////////////////////////////////////
// Internal


// interface TermProp {
//     names: Agda.Syntax.QName;
// };
//
// export class QName extends React.Component<QNameProps, {}> {
//
//     render() {
//         const { names } = this.props;
//         const filtered = names
//             .filter(x => !Name.isUnderscore(x));
//
//         return <span className='syntax qname'>{intersperse(filtered.map((name, i) => <Name
//             name={name}
//             key={i}
//         />), '.')}</span>
//     }
// }

////////////////////////////////////////////////////////////////////////////////
// Concrete

interface NameProps  {
    name: Agda.Syntax.Concrete.Name;
};

export class Name extends React.Component<NameProps, {}> {
    static isUnderscore(name: Agda.Syntax.Concrete.Name): boolean {
        if (name.kind === 'Name') {
            if (name.parts.length === 1 && name.parts[0]) {
                return name.parts[0] === '_';
            } else {
                return false;
            }
        } else {
            return true;
        }
    }

    render() {
        const { name } = this.props;
        if (name.kind === "Name") {
            const parts = name.parts.map(x => x || '_').join('');
            return <Link jump hover range={name.range}>{parts}</Link>
        } else {
            return <Link jump hover range={name.range}>_</Link>
        }
    }
}


interface QNameProps {
    names: Agda.Syntax.Concrete.QName;
};

export class QName extends React.Component<QNameProps, {}> {

    render() {
        const { names } = this.props;
        const filtered = names
            .filter(x => !Name.isUnderscore(x));

        return <span className='syntax qname'>{intersperse(filtered.map((name, i) => <Name
            name={name}
            key={i}
        />), '.')}</span>
    }
}
