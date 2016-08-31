import * as React from 'react';
import * as Promise from 'bluebird';

// import { QueryCancelledError } from '../error';
import { Error as E } from '../types';

// Atom shits

interface Props extends React.HTMLAttributes {
    error: E
}


class Error extends React.Component<Props, void> {
    render() {
        const { error } = this.props;
        switch (error.kind) {
            case 'Unparsed': return (
                <li className="list-item">
                    <span>{error.input}</span>
                </li>
            )
        }
    }
}

export default Error;
