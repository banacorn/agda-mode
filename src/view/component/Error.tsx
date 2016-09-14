import * as React from 'react';
import * as Promise from 'bluebird';
import { inspect } from 'util';
import { EventEmitter } from 'events';

import { View, Error as E, Location as Loc } from '../../types';

import Expr from './Expr';
import Location from './Location';
import Suggestion from './Suggestion';

interface Props {
    emitter: EventEmitter;
}

class Error extends React.Component<Props, void> {
    render() {
        const emitter = this.props.emitter;
        const error = this.props.children as E;

        let content = '';
        switch (error.kind) {
            case 'BadConstructor': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    The constructor <Expr emitter={emitter}>{error.constructor}</Expr><br/>
                    does not construct an element of <Expr emitter={emitter}>{error.constructorType}</Expr><br/>
                    when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    has type <Expr emitter={emitter}>{error.exprType}</Expr>
            </p>
            case 'CaseSingleHole': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Right hand side must be a single hole when making a case distinction<br/>
                    when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    has type <Expr emitter={emitter}>{error.exprType}</Expr><br/>
            </p>
            case 'ConstructorTarget': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    The target of a constructor must be the datatype applied to its parameters, <Expr emitter={emitter}>{error.expr}</Expr> isn't<br/>
                    when checking the constructor <Expr emitter={emitter}>{error.ctor}</Expr><br/>
                    in the declaration of <Expr emitter={emitter}>{error.decl}</Expr><br/>
            </p>
            case 'DefinitionTypeMismatch': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Type mismatch:<br/>
                    expected: <Expr emitter={emitter}>{error.expected}</Expr> of type <Expr emitter={emitter}>{error.expectedType}</Expr><br/>
                    <span>  </span>actual: <Expr emitter={emitter}>{error.actual}</Expr><br/>
                    when checking the definition of <Expr emitter={emitter}>{error.expr}</Expr>
            </p>
            case 'FunctionType': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    <Expr emitter={emitter}>{error.expr}</Expr> should be a function type, but it isn't<br/>
                    when checking that <Expr emitter={emitter}>{error.expr}</Expr> is a valid argument to a function of type <Expr emitter={emitter}>{error.exprType}</Expr><br/>
            </p>
            case 'IlltypedPattern': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Type mismatch when checking that the pattern <Expr emitter={emitter}>{error.pattern}</Expr> has type <Expr emitter={emitter}>{error.type}</Expr>
            </p>
            case 'LibraryNotFound': return <div className="error">
                    {error.libraries.map((library, i) => <div key={i}>
                            Library '{library.name}' not found.<br/>
                            Add the path to its .agda-lib file to<br/>
                            <span>    </span>{library.agdaLibFilePath}<br/>
                            to install.<br/>
                            <ul>
                                {library.installedLibraries.map((installed, j) => <li key={j}>
                                    {installed.name}: {installed.path}
                                </li>)}
                            </ul>
                        </div>
                    )}
            </div>
            case 'MissingDefinition': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Missing definition for <Expr emitter={emitter}>{error.expr}</Expr>
            </p>
            case 'MissingType': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Missing type signature for left hand side <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    when scope checking the declaration <Expr emitter={emitter}>{error.decl}</Expr>
            </p>
            case 'MultipleDefinition': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Multiple definitions of <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    Previous definition at <Location emitter={emitter}>{error.locationPrev}</Location><br/>
                    when scope checking the declaration<br/>
                    <Expr emitter={emitter}>{error.decl}</Expr> : <Expr emitter={emitter}>{error.declType}</Expr>
            </p>
            case 'NotInScope': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Not in scope: <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    <Suggestion emitter={emitter}>{error.suggestion}</Suggestion>
            </p>
            case 'Parse': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    <span className="text-error">{error.message}</span><br/>
                    <Expr emitter={emitter}>{error.expr}</Expr>
            </p>
            case 'PatternMatchOnNonDatatype': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    <Expr emitter={emitter}>{error.nonDatatype}</Expr> has type <Expr emitter={emitter}>{error.exprType}</Expr><br/>
                    when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    has type <Expr emitter={emitter}>{error.exprType}</Expr>
            </p>
            case 'RHSOmitted': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.<br/>
                    when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    has type <Expr emitter={emitter}>{error.exprType}</Expr>
            </p>
            case 'Termination': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Termination checking failed for the following functions:<br/>
                        <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    Problematic calls:<br/>
                    {error.calls.map((call, i) => <span key={i}>
                        <Expr emitter={emitter}>{call.expr}</Expr><br/>
                        <Location emitter={emitter}>{call.location}</Location>
                    </span>)}
            </p>
            case 'TypeMismatch': return <p className="error">
                    <Location emitter={emitter}>{error.location}</Location><br/>
                    Type mismatch:<br/>
                    expected: <Expr emitter={emitter}>{error.expected}</Expr><br/>
                    <span>  </span>actual: <Expr emitter={emitter}>{error.actual}</Expr><br/>
                    when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
                    has type <Expr emitter={emitter}>{error.exprType}</Expr>
            </p>
            case 'Unparsed': return <p className="error">{error.input}</p>
            default: return <p className="error">{inspect(error, false, null)}</p>
        }
    }
}

export default Error;
