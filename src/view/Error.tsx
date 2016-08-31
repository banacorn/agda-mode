import * as React from 'react';
import * as Promise from 'bluebird';

// import { QueryCancelledError } from '../error';
import { Error as E } from '../types';

// Atom shits

class Error extends React.Component<React.HTMLAttributes, void> {
    render() {
        const error = this.props.children as E;

        let content = '';
        switch (error.kind) {
            case 'Unparsed': return (
                <p {...this.props}>{error.input}</p>
            )
        }
    }
}

export default Error;
