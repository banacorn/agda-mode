import { Parser, seq, alt, takeWhile, sepBy1, succeed, all,
     digits, string, regex
    } from 'parsimmon';
import { trimBeforeAndSkip, spaces, token } from './combinator';
import { Agda } from '../../type';
import { normalize } from 'path';


////////////////////////////////////////////
// Errors
////////////////////////////////////////////

type EmacsAgdaError
    = EmacsAgdaError.NotInScope
    | EmacsAgdaError.BadConstructor
    | EmacsAgdaError.ConstructorTarget
    | EmacsAgdaError.CaseSingleHole
    | EmacsAgdaError.DefinitionTypeMismatch
    | EmacsAgdaError.FunctionType
    | EmacsAgdaError.IlltypedPattern
    | EmacsAgdaError.LibraryNotFound
    | EmacsAgdaError.MissingType
    | EmacsAgdaError.MissingDefinition
    | EmacsAgdaError.ModuleMismatch
    | EmacsAgdaError.MultipleDefinition
    | EmacsAgdaError.Parse
    | EmacsAgdaError.PatternMatchOnNonDatatype
    | EmacsAgdaError.RHSOmitted
    | EmacsAgdaError.TypeMismatch
    | EmacsAgdaError.Termination
    | EmacsAgdaError.UnparsedButLocated
    | EmacsAgdaError.Unparsed;

namespace EmacsAgdaError {
    export interface NotInScope {
        kind: 'NotInScope',
        header: string,
        range: Agda.Range,
        suggestion: string[],
        expr: string
    }

    export interface TypeMismatch {
        kind: 'TypeMismatch',
        header: string,
        range: Agda.Range,
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }


    export interface BadConstructor {
        kind: 'BadConstructor',
        header: string,
        range: Agda.Range,
        constructor: string,
        constructorType: string,
        expr: string,
        exprType: string
    }

    export interface DefinitionTypeMismatch {
        kind: 'DefinitionTypeMismatch',
        header: string,
        range: Agda.Range,
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
        range: Agda.Range,
        pattern: string;
        type: string;
    }

    export interface MissingType {
        kind: 'MissingType';
        header: string,
        range: Agda.Range,
        expr: string;
        decl: string;
    }

    export interface MultipleDefinition {
        kind: 'MultipleDefinition',
        header: string,
        range: Agda.Range,
        rangePrev: Agda.Range,
        expr: string,
        decl: string,
        declType: string
    }

    export interface MissingDefinition {
        kind: 'MissingDefinition',
        header: string,
        range: Agda.Range,
        expr: string
    }
    export interface RHSOmitted {
        kind: 'RHSOmitted',
        header: string,
        range: Agda.Range,
        expr: string,
        exprType: string
    }


    export interface Termination {
        kind: 'Termination',
        header: string,
        range: Agda.Range,
        expr: string,
        calls: {
            expr: string,
            range: Agda.Range,
        }[]
    }

    export interface ConstructorTarget {
        kind: 'ConstructorTarget',
        header: string,
        range: Agda.Range,
        expr: string,
        ctor: string,
        decl: string
    }

    export interface FunctionType {
        kind: 'FunctionType',
        header: string,
        range: Agda.Range,
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
        range: Agda.Range,
        message: string,
        expr: string,
    }

    export interface CaseSingleHole {
        kind: 'CaseSingleHole',
        header: string,
        range: Agda.Range,
        expr: string,
        exprType: string
    }

    export interface PatternMatchOnNonDatatype {
        kind: 'PatternMatchOnNonDatatype',
        header: string,
        range: Agda.Range,
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
        range: Agda.Range,
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

const singleLineInterval: Parser<Agda.Interval> = seq(
        digits,
        string(','),
        digits,
        string('-'),
        digits
    ).map((result) => {
        const row = parseInt(result[0]);
        const start = [row, parseInt(result[2])];
        const end   = [row, parseInt(result[4])];
        return <Agda.Interval>{ start, end };
    });

const multiLineInterval: Parser<Agda.Interval> = seq(
        digits,
        string(','),
        digits,
        string('-'),
        digits,
        string(','),
        digits
    ).map((result) => {
        const start = [parseInt(result[0]), parseInt(result[2])];
        const end   = [parseInt(result[4]), parseInt(result[6])];
        return <Agda.Interval>{ start, end };
    });

const interval = alt(multiLineInterval, singleLineInterval).skip(spaces);

const rangeAbsolute: Parser<Agda.Range> = seq(
        takeWhile((c) => c !== ':'),
        string(':'),
        interval
    ).map((result) => {
        return <Agda.Range>{
            source: normalize(result[0]),
            intervals: [result[2]]
        }
    }).skip(spaces);

const rangeRelative: Parser<Agda.Range> = seq(
        interval
    ).map((result) => {
        return <Agda.Range>{
            intervals: [result[0]]
        };
    }).skip(spaces);

const range: Parser<Agda.Range> = alt(
        rangeAbsolute,
        rangeRelative
    )

const didYouMean: Parser<string[]> = alt(seq(
        token('(did you mean'),
        sepBy1(regex(/'.*'/).skip(spaces), token('or')),
        token('?)')
    ), succeed([[], []])).map((result) => {
        return result[1].map((s) => s.substr(1, s.length - 2)); // remove single quotes
    }).skip(spaces);

const notInScope: Parser<EmacsAgdaError.NotInScope> = seq(
        range,
        token('Not in scope:').then(trimBeforeAndSkip('at ')).skip(range),
        didYouMean,
        all
    ).map((result) => {
        return <EmacsAgdaError.NotInScope>{
            kind: 'NotInScope',
            header: 'Not in scope',
            expr: result[1],
            range: result[0],
            suggestion: result[2]
        }
    });

const typeMismatch: Parser<EmacsAgdaError.TypeMismatch> = seq(
        range,
        alt(trimBeforeAndSkip('!=<'), trimBeforeAndSkip('=<'), trimBeforeAndSkip('!=')),
        trimBeforeAndSkip('of type'),
        trimBeforeAndSkip('when checking that the expression'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <EmacsAgdaError.TypeMismatch>{
            kind: 'TypeMismatch',
            header: 'Type mismatch',
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            exprType: result[5],
            range: result[0]
        };
    });

const badConstructor: Parser<EmacsAgdaError.BadConstructor> = seq(
        range,
        token('The constructor').then(trimBeforeAndSkip('does not construct an element of')),
        trimBeforeAndSkip('when checking that the expression'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <EmacsAgdaError.BadConstructor>{
            kind: 'BadConstructor',
            header: 'Bad constructor',
            range: result[0],
            constructor: result[1],
            constructorType: result[2],
            expr: result[3],
            exprType: result[4]
        };
    });

const definitionTypeMismatch: Parser<EmacsAgdaError.DefinitionTypeMismatch> = seq(
        range,
        alt(trimBeforeAndSkip('!=<'), trimBeforeAndSkip('=<'), trimBeforeAndSkip('!=')),
        trimBeforeAndSkip('of type'),
        trimBeforeAndSkip('when checking the definition of'),
        all
    ).map((result) => {
        return <EmacsAgdaError.DefinitionTypeMismatch>{
            kind: 'DefinitionTypeMismatch',
            header: 'Definition type mismatch',
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            range: result[0]
        };
    });

const illtypedPattern: Parser<EmacsAgdaError.IlltypedPattern> = seq(
        range,
        token('Type mismatch'),
        token('when checking that the pattern'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <EmacsAgdaError.IlltypedPattern>{
            kind: 'IlltypedPattern',
            header: 'Ill-typed Pattern',
            range: result[0],
            pattern: result[3],
            type: result[4]
        };
    });

const rhsOmitted: Parser<EmacsAgdaError.RHSOmitted> =  seq(
        range,
        token('The right-hand side can only be omitted if there is an absurd'),
        token('pattern, () or {}, in the left-hand side.'),
        token('when checking that the clause'),
        trimBeforeAndSkip('has type'),
        all
    ).map((result) => {
        return <EmacsAgdaError.RHSOmitted>{
            kind: 'RHSOmitted',
            header: 'Right-hand side omitted',
            range: result[0],
            expr: result[4],
            exprType: result[5]
        }
    });

const missingType: Parser<EmacsAgdaError.MissingType> =  seq(
        range,
        token('Missing type signature for left hand side'),
        trimBeforeAndSkip('when scope checking the declaration'),
        all
    ).map((result) => {
        return <EmacsAgdaError.MissingType>{
            kind: 'MissingType',
            header: 'Missing type signature',
            range: result[0],
            expr: result[2],
            decl: result[3]
        }
    });

const multipleDefinition: Parser<EmacsAgdaError.MultipleDefinition> =  seq(
        range,
        token('Multiple definitions of'),
        trimBeforeAndSkip('. Previous definition at'),
        range,
        token('when scope checking the declaration'),
        trimBeforeAndSkip(':'),
        all
    ).map((result) => {
        return <EmacsAgdaError.MultipleDefinition>{
            kind: 'MultipleDefinition',
            header: 'Multiple definition',
            range: result[0],
            rangePrev: result[3],
            expr: result[2],
            decl: result[5],
            declType: result[6]
        }
    });


const missingDefinition: Parser<EmacsAgdaError.MissingDefinition> =  seq(
        range,
        token('Missing definition for').then(all)
    ).map((result) => {
        return <EmacsAgdaError.MissingDefinition>{
            kind: 'MissingDefinition',
            header: 'Missing definition',
            range: result[0],
            expr: result[1]
        }
    });

const termination: Parser<EmacsAgdaError.Termination> =  seq(
        range,
        token('Termination checking failed for the following functions:'),
        trimBeforeAndSkip('Problematic calls:'),
        seq(
            trimBeforeAndSkip('(at'),
            range.skip(token(')'))
        ).map((result) => {
            return {
                expr: result[0],
                range: result[1]
            }
        }).atLeast(1)
    ).map((result) => {
        return <EmacsAgdaError.Termination>{
            kind: 'Termination',
            header: 'Termination error',
            range: result[0],
            expr: result[2],
            calls: result[3]
        }
    });

const constructorTarget: Parser<EmacsAgdaError.ConstructorTarget> =  seq(
        range,
        token('The target of a constructor must be the datatype applied to its'),
        token('parameters,').then(trimBeforeAndSkip('isn\'t')),
        token('when checking the constructor').then(trimBeforeAndSkip('in the declaration of')),
        all
    ).map((result) => {
        return <EmacsAgdaError.ConstructorTarget>{
            kind: 'ConstructorTarget',
            header: 'Constructor target error',
            range: result[0],
            expr: result[2],
            ctor: result[3],
            decl: result[4]
        }
    });


const functionType: Parser<EmacsAgdaError.FunctionType> =  seq(
        range,
        trimBeforeAndSkip('should be a function type, but it isn\'t'),
        token('when checking that').then(trimBeforeAndSkip('is a valid argument to a function of type')),
        all
    ).map((result) => {
        return <EmacsAgdaError.FunctionType>{
            kind: 'FunctionType',
            header: 'Not a function type',
            range: result[0],
            expr: result[2],
            exprType: result[1]
        }
    });

const moduleMismatch: Parser<EmacsAgdaError.ModuleMismatch> =  seq(
        token('You tried to load').then(trimBeforeAndSkip('which defines')),
        token('the module').then(trimBeforeAndSkip('. However, according to the include path this module')),
        token('should be defined in').then(all)
    ).map((result) => {
        return <EmacsAgdaError.ModuleMismatch>{
            kind: 'ModuleMismatch',
            header: 'Module mismatch',
            wrongPath: result[0],
            rightPath: result[2],
            moduleName: result[1]
        }
    });

const parse: Parser<EmacsAgdaError.Parse> =  seq(
        range,
        trimBeforeAndSkip(': ').then(trimBeforeAndSkip('...'))
    ).map((result) => {
        const i = (<string>result[1]).indexOf('\n');
        return <EmacsAgdaError.Parse>{
            kind: 'Parse',
            header: 'Parse error',
            range: result[0],
            message: (<string>result[1]).substring(0, i),
            expr: (<string>result[1]).substring(i + 1)
        }
    });


const caseSingleHole: Parser<EmacsAgdaError.CaseSingleHole> =  seq(
    range,
    token('Right hand side must be a single hole when making a case').then(token('distinction')),
    token('when checking that the expression'),
    trimBeforeAndSkip('has type'),
    all
).map((result) => {
    return <EmacsAgdaError.CaseSingleHole>{
        kind: 'CaseSingleHole',
        header: 'Not a single hole',
        range: result[0],
        expr: result[3],
        exprType: result[4]
    }
});

const patternMatchOnNonDatatype: Parser<EmacsAgdaError.PatternMatchOnNonDatatype> =  seq(
    range,
    token('Cannot pattern match on non-datatype').then(trimBeforeAndSkip('when checking that the expression')),
    trimBeforeAndSkip('has type'),
    all
).map((result) => {
    return <EmacsAgdaError.PatternMatchOnNonDatatype>{
        kind: 'PatternMatchOnNonDatatype',
        header: 'Pattern match on non-datatype',
        range: result[0],
        nonDatatype: result[1],
        expr: result[2],
        exprType: result[3]
    }
});

// for EmacsAgdaError.LibraryNotFound
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

// for EmacsAgdaError.LibraryNotFound
const libraryNotFoundItem: Parser<{}> =  seq(
    token('Library \'').then(trimBeforeAndSkip('\' not found.\nAdd the path to its .agda-lib file to\n  \'')),
    trimBeforeAndSkip('\'\nto install.\nInstalled libraries:'),
    alt(token('(none)'), installedLibrary.atLeast(1))
).map((result) => {
    if (typeof result[2] === 'string') {
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

const libraryNotFound: Parser<EmacsAgdaError.LibraryNotFound> =  seq(
    libraryNotFoundItem.atLeast(1)
).map((result) => {
    return <EmacsAgdaError.LibraryNotFound>{
        kind: 'LibraryNotFound',
        header: 'Library not found',
        libraries: result[0]
    }
});

const unparsedButLocated: Parser<EmacsAgdaError.UnparsedButLocated> = seq(
    range,
    all
).map((result) => {
    return <EmacsAgdaError.UnparsedButLocated>{
        kind: 'UnparsedButLocated',
        range: result[0],
        header: 'Error',
        input: result[1]
    }
});

const unparsed: Parser<EmacsAgdaError.Unparsed> = all.map((result) => {
    return <EmacsAgdaError.Unparsed>{
        kind: 'Unparsed',
        header: 'Error',
        input: result
    }
});

const errorParser: Parser<EmacsAgdaError> = alt(
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

function parseError(input: string): EmacsAgdaError {
    const parseResult = errorParser.parse(input);
    if (parseResult.status) {
        // if (parseResult.value.kind === 'UnparsedButLocated') {
        //     // console.info(parseResult.value.location);
        //     // console.warn(parseResult.value.input);
        // }
        return parseResult.value;
    } else {
        // console.warn(parseResult)
        return <EmacsAgdaError.Unparsed>{
            kind: 'Unparsed',
            header: 'Error',
            input: input
        }
    }
}

export {
    parseError,
    range,
    EmacsAgdaError
}
