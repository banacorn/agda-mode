import * as React from 'react';
import { inspect } from 'util';
import { EventEmitter } from 'events';
import { EmacsAgdaError } from '../../../../parser/emacs';

import Expr from './Expr';
var Range = require('./../../../../Reason/Range.bs').jsComponent;

import Suggestion from './Suggestion';

class EmacsError extends React.Component<{}, {}> {
    render() {
        const error = this.props.children as EmacsAgdaError;

        switch (error.kind) {
            case 'BadConstructor': return <p className="error">
                    <Range range={error.range} /><br/>
                    The constructor <Expr>{error.constructor}</Expr><br/>
                    does not construct an element of <Expr>{error.constructorType}</Expr><br/>
                    when checking that the expression <Expr>{error.expr}</Expr><br/>
                    has type <Expr>{error.exprType}</Expr>
            </p>
            case 'CaseSingleHole': return <p className="error">
                    <Range range={error.range} /><br/>
                    Right hand side must be a single hole when making a case distinction<br/>
                    when checking that the expression <Expr>{error.expr}</Expr><br/>
                    has type <Expr>{error.exprType}</Expr><br/>
            </p>
            case 'ConstructorTarget': return <p className="error">
                    <Range range={error.range} /><br/>
                    The target of a constructor must be the datatype applied to its parameters, <Expr>{error.expr}</Expr> isn't<br/>
                    when checking the constructor <Expr>{error.ctor}</Expr><br/>
                    in the declaration of <Expr>{error.decl}</Expr><br/>
            </p>
            case 'DefinitionTypeMismatch': return <p className="error">
                    <Range range={error.range} /><br/>
                    Type mismatch:<br/>
                    expected: <Expr>{error.expected}</Expr> of type <Expr>{error.expectedType}</Expr><br/>
                    <span>  </span>actual: <Expr>{error.actual}</Expr><br/>
                    when checking the definition of <Expr>{error.expr}</Expr>
            </p>
            case 'FunctionType': return <p className="error">
                    <Range range={error.range} /><br/>
                    <Expr>{error.expr}</Expr> should be a function type, but it isn't<br/>
                    when checking that <Expr>{error.expr}</Expr> is a valid argument to a function of type <Expr>{error.exprType}</Expr><br/>
            </p>
            case 'IlltypedPattern': return <p className="error">
                    <Range range={error.range} /><br/>
                    Type mismatch when checking that the pattern <Expr>{error.pattern}</Expr> has type <Expr>{error.type}</Expr>
            </p>
            case 'LibraryNotFound': return <div className="error">
                    {error.libraries.map((library, i) => <div key={i}>
                            Library '{library.name}' not found.<br/>
                            Add the path to its .agda-lib file to<br/>
                            <span>    </span>{library.agdaLibFilePath}<br/>
                            to install.<br/>
                            Installed libraries:<br/>
                            <ul>
                                {library.installedLibraries.length ?
                                    library.installedLibraries.map((installed, j) => <li key={j}>
                                        {installed.name}: {installed.path}
                                    </li>)
                                    : <li>(none)</li>
                                }
                            </ul>
                        </div>
                    )}
            </div>
            case 'MissingDefinition': return <p className="error">
                    <Range range={error.range} /><br/>
                    Missing definition for <Expr>{error.expr}</Expr>
            </p>
            case 'MissingType': return <p className="error">
                    <Range range={error.range} /><br/>
                    Missing type signature for left hand side <Expr>{error.expr}</Expr><br/>
                    when scope checking the declaration <Expr>{error.decl}</Expr>
            </p>
            case 'MultipleDefinition': return <p className="error">
                    <Range range={error.range} /><br/>
                    Multiple definitions of <Expr>{error.expr}</Expr><br/>
                    Previous definition at <Range range={error.rangePrev} /><br/>
                    when scope checking the declaration<br/>
                    <Expr>{error.decl}</Expr> : <Expr>{error.declType}</Expr>
            </p>
            case 'NotInScope': return <p className="error">
                    <Range range={error.range} /><br/>
                    Not in scope: <Expr>{error.expr}</Expr><br/>
                    <Suggestion>{error.suggestion}</Suggestion>
            </p>
            case 'Parse': return <p className="error">
                    <Range range={error.range} /><br/>
                    <span className="text-error">{error.message}</span><br/>
                    <Expr>{error.expr}</Expr>
            </p>
            case 'PatternMatchOnNonDatatype': return <p className="error">
                    <Range range={error.range} /><br/>
                    <Expr>{error.nonDatatype}</Expr> has type <Expr>{error.exprType}</Expr><br/>
                    when checking that the expression <Expr>{error.expr}</Expr><br/>
                    has type <Expr>{error.exprType}</Expr>
            </p>
            case 'RHSOmitted': return <p className="error">
                    <Range range={error.range} /><br/>
                    The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.<br/>
                    when checking that the expression <Expr>{error.expr}</Expr><br/>
                    has type <Expr>{error.exprType}</Expr>
            </p>
            case 'Termination': return <p className="error">
                    <Range range={error.range} /><br/>
                    Termination checking failed for the following functions:<br/>
                        <Expr>{error.expr}</Expr><br/>
                    Problematic calls:<br/>
                    {error.calls.map((call, i) => <span key={i}>
                        <Expr>{call.expr}</Expr><br/>
                        <Range range={call.range} />
                    </span>)}
            </p>
            case 'TypeMismatch': return <p className="error">
                    <Range range={error.range} /><br/>
                    Type mismatch:<br/>
                    expected: <Expr>{error.expected}</Expr><br/>
                    <span>  </span>actual: <Expr>{error.actual}</Expr><br/>
                    when checking that the expression <Expr>{error.expr}</Expr><br/>
                    has type <Expr>{error.exprType}</Expr>
            </p>
            case 'UnparsedButLocated': return <p className="error">
                    <Range range={error.range} /><br/>
                    {error.input}
            </p>
            case 'Unparsed': return <p className="error">{error.input}</p>
            default: return <p className="error">{inspect(error, false, null)}</p>
        }
    }
}

export default EmacsError;
