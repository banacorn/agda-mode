import * as React from 'react';
import * as Promise from 'bluebird';
import { inspect } from 'util';

import { View, Error as E, Location as Loc } from '../types';

import Expr from './Expr';
import Location from './Location';

interface Props {
    jumpToGoal: (index: number) => void;
    jumpToLocation: (loc: Loc) => void;
}

class Error extends React.Component<Props, void> {
    render() {
        const error = this.props.children as E;
        const { jumpToGoal, jumpToLocation } = this.props;

        let content = '';
        switch (error.kind) {
            case 'BadConstructor': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    The constructor <Expr jumpToGoal={jumpToGoal}>{error.constructor}</Expr><br/>
                    does not construct an element of <Expr jumpToGoal={jumpToGoal}>{error.constructorType}</Expr><br/>
                    when checking that the expression <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    has type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr>
            </p>
            case 'CaseSingleHole': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Right hand side must be a single hole when making a case distinction<br/>
                    when checking that the expression <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    has type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr><br/>
            </p>
            case 'Unparsed': return <p className="error">{error.input}</p>
            default: return <p className="error">{inspect(error, false, null)}</p>
        }
    }
}

export default Error;
