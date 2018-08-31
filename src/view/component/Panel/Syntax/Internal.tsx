import * as React from 'react';
import { Agda } from './../../../../type';
import { intersperse } from './../../../../util';

import Link from '../Body/Link'
import { Name } from './Concrete'

////////////////////////////////////////////////////////////////////////////////
// Term

interface TermProps {
    value: Agda.Syntax.Internal.Term;
};

export class Term extends React.Component<TermProps, {}> {
    render() {
        const { value } = this.props;
        switch (value.kind) {
            case 'Def':
                return <span className='syntax term'>
                    <Name value={value.name.name.concrete} />
                </span>
            case 'Sort':
                return <span className='syntax term'>
                    <Sort value={value.sort} />
                </span>
            default:
                return <span className='syntax term'>{JSON.stringify(value)}</span>
        }
    }
}

////////////////////////////////////////////////////////////////////////////////
// Type

interface TypeProps {
    value: Agda.Syntax.Internal.Type;
};

export class Type extends React.Component<TypeProps, {}> {
    render() {
        const { value } = this.props;
        return <Term value={value.payload} />;
    }
}


////////////////////////////////////////////////////////////////////////////////
// Sort

interface SortProps {
    value: Agda.Syntax.Internal.Sort;
};

// TODO: everything
export class Sort extends React.Component<SortProps, {}> {
    render() {
        const { value } = this.props;
        switch (value.kind) {
            case 'Type':
                return <span className='syntax sort'>Set</span>
            default:
                return <span className='syntax sort'>{value.kind}</span>
        }
    }
}
