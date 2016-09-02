import * as React from 'react';
import * as Promise from 'bluebird';
import { inspect } from 'util';

import { View, Error as E, Location as Loc } from '../../types';

import Expr from './Expr';
import Location from './Location';
import Suggestion from './Suggestion';

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
            case 'ConstructorTarget': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    The target of a constructor must be the datatype applied to its parameters, <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr> isn't<br/>
                    when checking the constructor <Expr jumpToGoal={jumpToGoal}>{error.ctor}</Expr><br/>
                    in the declaration of <Expr jumpToGoal={jumpToGoal}>{error.decl}</Expr><br/>
            </p>
            case 'DefinitionTypeMismatch': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Type mismatch:<br/>
                    expected: <Expr jumpToGoal={jumpToGoal}>{error.expected}</Expr> of type <Expr jumpToGoal={jumpToGoal}>{error.expectedType}</Expr><br/>
                    <span>  </span>actual: <Expr jumpToGoal={jumpToGoal}>{error.actual}</Expr><br/>
                    when checking the definition of <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr>
            </p>
            case 'FunctionType': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr> should be a function type, but it isn't<br/>
                    when checking that <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr> is a valid argument to a function of type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr><br/>
            </p>
            case 'MissingDefinition': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Missing definition for <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr>
            </p>
            case 'MissingType': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Missing type signature for left hand side <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    when scope checking the declaration <Expr jumpToGoal={jumpToGoal}>{error.decl}</Expr>
            </p>
            case 'MultipleDefinition': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Multiple definitions of <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    Previous definition at <Location jumpToLocation={jumpToLocation}>{error.locationPrev}</Location><br/>
                    when scope checking the declaration<br/>
                    <Expr jumpToGoal={jumpToGoal}>{error.decl}</Expr> : <Expr jumpToGoal={jumpToGoal}>{error.declType}</Expr>
            </p>
            case 'NotInScope': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Not in scope: <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    <Suggestion jumpToGoal={jumpToGoal}>{error.suggestion}</Suggestion>
            </p>
            case 'Parse': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    <span className="text-error">{error.message}</span><br/>
                    <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr>
            </p>
            case 'PatternMatchOnNonDatatype': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    <Expr jumpToGoal={jumpToGoal}>{error.nonDatatype}</Expr> has type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr><br/>
                    when checking that the expression <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    has type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr>
            </p>
            case 'RHSOmitted': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.<br/>
                    when checking that the expression <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    has type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr>
            </p>
            case 'Termination': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Termination checking failed for the following functions:<br/>
                        <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    Problematic calls:<br/>
                    {error.calls.map((call, i) => <span key={i}>
                        <Expr jumpToGoal={jumpToGoal}>{call.expr}</Expr><br/>
                        <Location jumpToLocation={jumpToLocation}>{call.location}</Location>
                    </span>)}
            </p>
            case 'TypeMismatch': return <p className="error">
                    <Location jumpToLocation={jumpToLocation}>{error.location}</Location><br/>
                    Type mismatch:<br/>
                    expected: <Expr jumpToGoal={jumpToGoal}>{error.expected}</Expr><br/>
                    <span>  </span>actual: <Expr jumpToGoal={jumpToGoal}>{error.actual}</Expr><br/>
                    when checking that the expression <Expr jumpToGoal={jumpToGoal}>{error.expr}</Expr><br/>
                    has type <Expr jumpToGoal={jumpToGoal}>{error.exprType}</Expr>
            </p>
            case 'Unparsed': return <p className="error">{error.input}</p>
            default: return <p className="error">{inspect(error, false, null)}</p>
        }
    }
}

export default Error;
