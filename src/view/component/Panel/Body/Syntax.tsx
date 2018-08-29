import * as _ from 'lodash';
import * as React from 'react';
import { EventEmitter } from 'events';
import { Agda } from './../../../../type';


interface NameProps  {
    name: Agda.Syntax.Name;
};

export class Name extends React.Component<NameProps, {}> {
    static isUnderscore(name: Agda.Syntax.Name): boolean {
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
            return <span>{parts}</span>
        } else {
            return <span>_</span>
        }
        return <span>:D</span>
    }
}


interface QNameProps {
    names: Agda.Syntax.QName;
};


// WTF
function intersperse(array, sep) {
    if (array.length === 0) {
        return [];
    }

    return array.slice(1).reduce(function(xs, x) {
        return xs.concat([sep, x]);
    }, [array[0]]);
}

export class QName extends React.Component<QNameProps, {}> {

    render() {
        const { names } = this.props;
        const filtered = names
            .filter(x => !Name.isUnderscore(x));

        return <span>{intersperse(filtered.map((name, i) => <Name
            name={name}
            key={i}
        />), '.')}</span>
    }
}
