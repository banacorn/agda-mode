import { Parser, seq, alt, takeWhile, sepBy1, succeed, all,
     digits, string, regex
    } from 'parsimmon';
import { trimBeforeAndSkip, spaces, token } from './combinator';
var { Point, Range } = require('atom');
import { View, Location } from '../type';
import { normalize } from 'path';


////////////////////////////////////////////
// Errors
////////////////////////////////////////////

type AgdaError
    = AgdaError.NotInScope
    | AgdaError.BadConstructor
    | AgdaError.ConstructorTarget
    | AgdaError.CaseSingleHole
    | AgdaError.DefinitionTypeMismatch
    | AgdaError.FunctionType
    | AgdaError.IlltypedPattern
    | AgdaError.LibraryNotFound
    | AgdaError.MissingType
    | AgdaError.MissingDefinition
    | AgdaError.ModuleMismatch
    | AgdaError.MultipleDefinition
    | AgdaError.Parse
    | AgdaError.PatternMatchOnNonDatatype
    | AgdaError.RHSOmitted
    | AgdaError.TypeMismatch
    | AgdaError.Termination
    | AgdaError.UnparsedButLocated
    | AgdaError.Unparsed;

namespace AgdaError {
    export interface NotInScope {
        kind: 'NotInScope',
        header: string,
        location: Location,
        suggestion: string[],
        expr: string
    }

    export interface TypeMismatch {
        kind: 'TypeMismatch',
        header: string,
        location: Location
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }


    export interface BadConstructor {
        kind: 'BadConstructor',
        header: string,
        location: Location,
        constructor: string,
        constructorType: string,
        expr: string,
        exprType: string
    }

    export interface DefinitionTypeMismatch {
        kind: 'DefinitionTypeMismatch',
        header: string,
        location: Location
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }

    // https://github.com/agda/agda/blob/2794f9d84667e6f875d0c6b74bcbae9b1cc507d6/src/full/Agda/TypeChecking/Monad/Base.hs#L2341
    export interface IlltypedPattern {
        kind: 'IlltypedPattern';
        header: string;
        location: Location;
        pattern: string;
        type: string;
    }

    export interface MissingType {
        kind: 'MissingType';
        header: string,
        location: Location;
        expr: string;
        decl: string;
    }

    export interface MultipleDefinition {
        kind: 'MultipleDefinition',
        header: string,
        location: Location,
        locationPrev: Location,
        expr: string,
        decl: string,
        declType: string
    }

    export interface MissingDefinition {
        kind: 'MissingDefinition',
        header: string,
        location: Location,
        expr: string
    }
    export interface RHSOmitted {
        kind: 'RHSOmitted',
        header: string,
        location: Location,
        expr: string,
        exprType: string
    }


    export interface Termination {
        kind: 'Termination',
        header: string,
        location: Location,
        expr: string,
        calls: {
            expr: string,
            location: Location
        }[]
    }

    export interface ConstructorTarget {
        kind: 'ConstructorTarget',
        header: string,
        location: Location,
        expr: string,
        ctor: string,
        decl: string
    }

    export interface FunctionType {
        kind: 'FunctionType',
        header: string,
        location: Location,
        expr: string,
        exprType: string
    }

    export interface ModuleMismatch {
        kind: 'ModuleMismatch',
        header: string,
        wrongPath: string,
        rightPath: string,
        moduleName: string
    }

    export interface Parse {
        kind: 'Parse',
        header: string,
        location: Location
        message: string,
        expr: string,
    }

    export interface CaseSingleHole {
        kind: 'CaseSingleHole',
        header: string,
        location: Location,
        expr: string,
        exprType: string
    }

    export interface PatternMatchOnNonDatatype {
        kind: 'PatternMatchOnNonDatatype',
        header: string,
        location: Location,
        nonDatatype: string,
        expr: string,
        exprType: string
    }

    export interface LibraryNotFound {
        kind: 'LibraryNotFound',
        header: string,
        libraries: {
            name: string,
            agdaLibFilePath: string,
            installedLibraries: {
                name: string,
                path: string
            }[]
        }[]
    }

    export interface UnparsedButLocated {
        kind: 'UnparsedButLocated',
        location: Location,
        header: string,
        input: string,
    }

    export interface Unparsed {
        kind: 'Unparsed',
        header: string,
        input: string,
    }
}
////////////////////////////////////////////////////////////////////////////////
//  Error
////////////////////////////////////////////////////////////////////////////////

const singleLineRange: Parser<[Range, boolean]> = seq(
        digits,
        string(','),
        digits,
        string('-'),
        digits
    ).map((result) => {
        const row = parseInt(result[0]) - 1;
        const start = new Point(row, parseInt(result[2]) - 1);
        const end   = new Point(row, parseInt(result[4]) - 1);
        return <[Range, boolean]>[new Range(start, end), true];
    });

const multiLineRange: Parser<[Range, boolean]> = seq(
        digits,
        string(','),
        digits,
        string('-'),
        digits,
        string(','),
        digits
    ).map((result) => {
        const start = new Point(parseInt(result[0]) - 1, parseInt(result[2]) - 1);
        const end   = new Point(parseInt(result[4]) - 1, parseInt(result[6]) - 1);
        return <[Range, boolean]>[new Range(start, end), false];
    });

const range = alt(multiLineRange, singleLineRange).skip(spaces);

const locationAbsolute: Parser<Location> = seq(
        takeWhile((c) => c !== ':'),
        string(':'),
        range
    ).map((result) => {
        return {
            path: normalize(result[0]),
            range: result[2][0],
            isSameLine: result[2][1]
        };
    }).skip(spaces);

const locationRelative: Parser<Location> = seq(
        range
    ).map((result) => {
        return <Location>{
            path: '',
            range: result[0][0],
            isSameLine: result[0][1]
        };
    }).skip(spaces);

const location: Parser<Location> = alt(
        locationAbsolute,
        locationRelative
    )

const didYouMean: Parser<string[]> = alt(seq(
        token('(did you mean'),
        sepBy1(regex(/'.*'/).skip(spaces), token('or')),
        token('?)')
    ), succeed([[], []])).map((result) => {
        return result[1].map((s) => s.substr(1, s.length - 2)); // remove single quotes
    }).skip(spaces);

const notInScope: Parser<AgdaError.NotInScope> = seq(
        location,
        token('Not in scope:').then(trimBeforeAndSkip('at ')).skip(location),
        didYouMean,
        all
    ).map((result) => {
        return <AgdaError.NotInScope>{
            kind: 'NotInScope',
            header: 'Not in scope',
            expr: result[1],
            location: result[0],
            suggestion: result[2]
        }
    });

const typeMismatch: Parser<AgdaError.TypeMismatch> = seq(
        location,
        alt(trimBeforeAndSkip('!=<'), trimBeforeAndSkip('=<'), trimBeforeAndSkip('!=')),
        trimBeforeAndSkip('of type'),
        trimBeforeAndSkip('when checking that the expression'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <AgdaError.TypeMismatch>{
            kind: 'TypeMismatch',
            header: 'Type mismatch',
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            exprType: result[5],
            location: result[0]
        };
    });

const badConstructor: Parser<AgdaError.BadConstructor> = seq(
        location,
        token('The constructor').then(trimBeforeAndSkip('does not construct an element of')),
        trimBeforeAndSkip('when checking that the expression'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <AgdaError.BadConstructor>{
            kind: 'BadConstructor',
            header: 'Bad constructor',
            location: result[0],
            constructor: result[1],
            constructorType: result[2],
            expr: result[3],
            exprType: result[4]
        };
    });

const definitionTypeMismatch: Parser<AgdaError.DefinitionTypeMismatch> = seq(
        location,
        alt(trimBeforeAndSkip('!=<'), trimBeforeAndSkip('=<'), trimBeforeAndSkip('!=')),
        trimBeforeAndSkip('of type'),
        trimBeforeAndSkip('when checking the definition of'),
        all
    ).map((result) => {
        return <AgdaError.DefinitionTypeMismatch>{
            kind: 'DefinitionTypeMismatch',
            header: 'Definition type mismatch',
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            location: result[0]
        };
    });

const illtypedPattern: Parser<AgdaError.IlltypedPattern> = seq(
        location,
        token('Type mismatch'),
        token('when checking that the pattern'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <AgdaError.IlltypedPattern>{
            kind: 'IlltypedPattern',
            header: 'Ill-typed Pattern',
            location: result[0],
            pattern: result[3],
            type: result[4]
        };
    });

const rhsOmitted: Parser<AgdaError.RHSOmitted> =  seq(
        location,
        token('The right-hand side can only be omitted if there is an absurd'),
        token('pattern, () or {}, in the left-hand side.'),
        token('when checking that the clause'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <AgdaError.RHSOmitted>{
            kind: 'RHSOmitted',
            header: 'Right-hand side omitted',
            location: result[0],
            expr: result[4],
            exprType: result[5]
        }
    });

const missingType: Parser<AgdaError.MissingType> =  seq(
        location,
        token('Missing type signature for left hand side'),
        trimBeforeAndSkip('when scope checking the declaration'),
        all
    ).map((result) => {
        return <AgdaError.MissingType>{
            kind: 'MissingType',
            header: 'Missing type signature',
            location: result[0],
            expr: result[2],
            decl: result[3]
        }
    });

const multipleDefinition: Parser<AgdaError.MultipleDefinition> =  seq(
        location,
        token('Multiple definitions of'),
        trimBeforeAndSkip('. Previous definition at'),
        location,
        token('when scope checking the declaration'),
        trimBeforeAndSkip(':'),
        all
    ).map((result) => {
        return <AgdaError.MultipleDefinition>{
            kind: 'MultipleDefinition',
            header: 'Multiple definition',
            location: result[0],
            locationPrev: result[3],
            expr: result[2],
            decl: result[5],
            declType: result[6]
        }
    });


const missingDefinition: Parser<AgdaError.MissingDefinition> =  seq(
        location,
        token('Missing definition for').then(all)
    ).map((result) => {
        return <AgdaError.MissingDefinition>{
            kind: 'MissingDefinition',
            header: 'Missing definition',
            location: result[0],
            expr: result[1]
        }
    });

const termination: Parser<AgdaError.Termination> =  seq(
        location,
        token('Termination checking failed for the following functions:'),
        trimBeforeAndSkip('Problematic calls:'),
        seq(
            trimBeforeAndSkip('(at'),
            location.skip(token(')'))
        ).map((result) => {
            return {
                expr: result[0],
                location: result[1]
            }
        }).atLeast(1)
    ).map((result) => {
        return <AgdaError.Termination>{
            kind: 'Termination',
            header: 'Termination error',
            location: result[0],
            expr: result[2],
            calls: result[3]
        }
    });

const constructorTarget: Parser<AgdaError.ConstructorTarget> =  seq(
        location,
        token('The target of a constructor must be the datatype applied to its'),
        token('parameters,').then(trimBeforeAndSkip('isn\'t')),
        token('when checking the constructor').then(trimBeforeAndSkip('in the declaration of')),
        all
    ).map((result) => {
        return <AgdaError.ConstructorTarget>{
            kind: 'ConstructorTarget',
            header: 'Constructor target error',
            location: result[0],
            expr: result[2],
            ctor: result[3],
            decl: result[4]
        }
    });


const functionType: Parser<AgdaError.FunctionType> =  seq(
        location,
        trimBeforeAndSkip('should be a function type, but it isn\'t'),
        token('when checking that').then(trimBeforeAndSkip('is a valid argument to a function of type')),
        all
    ).map((result) => {
        return <AgdaError.FunctionType>{
            kind: 'FunctionType',
            header: 'Not a function type',
            location: result[0],
            expr: result[2],
            exprType: result[1]
        }
    });

const moduleMismatch: Parser<AgdaError.ModuleMismatch> =  seq(
        token('You tried to load').then(trimBeforeAndSkip('which defines')),
        token('the module').then(trimBeforeAndSkip('. However, according to the include path this module')),
        token('should be defined in').then(all)
    ).map((result) => {
        return <AgdaError.ModuleMismatch>{
            kind: 'ModuleMismatch',
            header: 'Module mismatch',
            wrongPath: result[0],
            rightPath: result[2],
            moduleName: result[1]
        }
    });

const parse: Parser<AgdaError.Parse> =  seq(
        location,
        trimBeforeAndSkip(': ').then(trimBeforeAndSkip('...'))
    ).map((result) => {
        const i = (<string>result[1]).indexOf('\n');
        return <AgdaError.Parse>{
            kind: 'Parse',
            header: 'Parse error',
            location: result[0],
            message: (<string>result[1]).substring(0, i),
            expr: (<string>result[1]).substring(i + 1)
        }
    });


const caseSingleHole: Parser<AgdaError.CaseSingleHole> =  seq(
    location,
    token('Right hand side must be a single hole when making a case').then(token('distinction')),
    token('when checking that the expression'),
    trimBeforeAndSkip('has type'),
    all
).map((result) => {
    return <AgdaError.CaseSingleHole>{
        kind: 'CaseSingleHole',
        header: 'Not a single hole',
        location: result[0],
        expr: result[3],
        exprType: result[4]
    }
});

const patternMatchOnNonDatatype: Parser<AgdaError.PatternMatchOnNonDatatype> =  seq(
    location,
    token('Cannot pattern match on non-datatype').then(trimBeforeAndSkip('when checking that the expression')),
    trimBeforeAndSkip('has type'),
    all
).map((result) => {
    return <AgdaError.PatternMatchOnNonDatatype>{
        kind: 'PatternMatchOnNonDatatype',
        header: 'Pattern match on non-datatype',
        location: result[0],
        nonDatatype: result[1],
        expr: result[2],
        exprType: result[3]
    }
});

// for AgdaError.LibraryNotFound
const installedLibrary: Parser<{name: string, path: string}> = seq(
    regex(/\s*(\S+)\s*\(/),
    trimBeforeAndSkip(')')
).map((result) => {
    const match = (result[0] as string).match(/\s*(\S+)\s*\(/);
    return <{name: string, path: string}>{
        name: match[1],
        path: result[1]
    }
});

// for AgdaError.LibraryNotFound
const libraryNotFoundItem: Parser<{}> =  seq(
    token('Library \'').then(trimBeforeAndSkip('\' not found.\nAdd the path to its .agda-lib file to\n  \'')),
    trimBeforeAndSkip('\'\nto install.\nInstalled libraries:'),
    alt(token('(none)'), installedLibrary.atLeast(1))
).map((result) => {
    if (result[2] === '(none)') {
        return <{}>{
            name: result[0],
            agdaLibFilePath: result[1],
            installedLibraries: []
        }
    } else {
        return <{}>{
            name: result[0],
            agdaLibFilePath: result[1],
            installedLibraries: result[2]
        }
    }
});

const libraryNotFound: Parser<AgdaError.LibraryNotFound> =  seq(
    libraryNotFoundItem.atLeast(1)
).map((result) => {
    return <AgdaError.LibraryNotFound>{
        kind: 'LibraryNotFound',
        header: 'Library not found',
        libraries: result[0]
    }
});

const unparsedButLocated: Parser<AgdaError.UnparsedButLocated> = seq(
    location,
    all
).map((result) => {
    return <AgdaError.UnparsedButLocated>{
        kind: 'UnparsedButLocated',
        location: result[0],
        header: 'Error',
        input: result[1]
    }
});

const unparsed: Parser<AgdaError.Unparsed> = all.map((result) => {
    return <AgdaError.Unparsed>{
        kind: 'Unparsed',
        header: 'Error',
        input: result
    }
});

const errorParser: Parser<Error> = alt(
    badConstructor,
    constructorTarget,
    caseSingleHole,
    definitionTypeMismatch,
    functionType,
    illtypedPattern,
    libraryNotFound,
    missingType,
    multipleDefinition,
    missingDefinition,
    moduleMismatch,
    notInScope,
    rhsOmitted,
    termination,
    typeMismatch,
    parse,
    patternMatchOnNonDatatype,
    unparsedButLocated,
    unparsed
);

function parseError(input: string): AgdaError {
    const parseResult = errorParser.parse(input);
    if (parseResult.status) {
        if (parseResult.value.kind === 'UnparsedButLocated') {
            // console.info(parseResult.value.location);
            // console.warn(parseResult.value.input);
        }
        return parseResult.value;
    } else {
        // console.warn(parseResult)
        return <AgdaError.Unparsed>{
            kind: 'Unparsed',
            header: 'Error',
            input: input
        }
    }
}

export {
    parseError,
    AgdaError
}
