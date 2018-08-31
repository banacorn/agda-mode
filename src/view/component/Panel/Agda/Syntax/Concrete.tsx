import * as React from 'react';
import { intersperse } from './../../../../../util';

import { Agda } from './../../../../../type';

import Link from './../../Body/Link'

interface NameProps  {
    value: Agda.Syntax.Concrete.Name;
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
        const { value } = this.props;
        if (value.kind === "Name") {
            const parts = value.parts.map(x => x || '_').join('');
            return <Link jump hover range={value.range}>{parts}</Link>
        } else {
            return <Link jump hover range={value.range}>_</Link>
        }
    }
}


interface QNameProps {
    value: Agda.Syntax.Concrete.QName;
};

export class QName extends React.Component<QNameProps, {}> {

    render() {
        const { value } = this.props;
        const filtered = value
            .filter(x => !Name.isUnderscore(x));

        return <span className='syntax qname'>{intersperse(filtered.map((name, i) => <Name
            value={name}
            key={i}
        />), '.')}</span>
    }
}
