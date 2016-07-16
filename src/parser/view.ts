import * as _ from "lodash";;
import { normalize } from "path";
import { parseFilepath } from "./util";
import { View } from "../types";
import { Parser, seq, alt, takeWhile, sepBy1, all, any, custom, succeed,
    regex, digits, string
    } from "parsimmon";

var { Point, Range } = require('atom');

function parseContent(lines: string[]): View.Content {
    const {banner, body} = divideContent(lines);
    const bannerItems = concatItems(banner).map(parseBannerItem);
    const bodyItems = concatItems(body).map(parseBodyItem);
    return {
        banner: bannerItems,
        body: bodyItems
    }
}


// divide content into header and body
function divideContent(lines: string[]): {
    banner: string[],
    body: string[]
} {
    const notEmpty = lines.length > 0;
    const index = lines.indexOf("————————————————————————————————————————————————————————————");
    const isSectioned = index !== -1;

    if (notEmpty && isSectioned) {
        return {
            banner: lines.slice(0, index),
            body: lines.slice(index + 1, lines.length)
        }
    }
    else {
        return {
            banner: [],
            body: lines
        }
    }
}

// concatenate multiline judgements
function concatItems(lines: string[]): string[] {
    const newlineRegex = /^(?:Goal\:|Have\:|\S+\s+\:\s*|Sort) \S*/;

    let result = [];
    let currentLine = 0;
    lines.forEach((line, i) => {
        const notTheLastLine = i + 1 < lines.length;
        const preemptLine = notTheLastLine ? line + "\n" + lines[i + 1] : line;
        if (line.match(newlineRegex) || preemptLine.match(newlineRegex)) {
            // is a new line
            currentLine = i;
            result[currentLine] = line;
        } else {
            // is not a new line, concat to the previous line
            if (result[currentLine])
                result[currentLine] = result[currentLine].concat("\n" + line);
            else
                result[currentLine] = line;
        }
    });
    return _.compact(result);
}


////////////////////////////////////////////////////////////////////////////////
//  Components
////////////////////////////////////////////////////////////////////////////////


function parseBannerItem(str: string): View.BannerItem {
    const regex = /^(Goal|Have)\: ((?:\n|.)+)/;
    const result = str.match(regex);
    return {
        label: result[1],
        type: result[2]
    };
}

function parseOccurence(str: string): View.Occurence {
    const regex = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/;
    const result = str.match(regex);

    if (result) {
        const rowStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        const rowEnd   = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[7]);
        const colStart = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[8]);
        const colEnd   = parseInt(result[6]) ? parseInt(result[6]) : parseInt(result[9]);
        const range = new Range(
            new Point(rowStart - 1, colStart - 1),
            new Point(rowEnd - 1, colEnd - 1)
        );
        return {
            body: result[1],
            location: {
                path: parseFilepath(result[2]),
                range: range,
                isSameLine: result[3] === undefined
            }
        };
    }
}


function parseGoal(str: string): View.Goal {
    const regex = /^(\?\d+) \: ((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: "goal",
            index: result[1],
            type: result[2]
        };
    }
}

function parseJudgement(str: string): View.Judgement {
    const regex = /^(?:([^\_\?](?:\n|.)*)) \: ((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: "type judgement",
            expr: result[1],
            type: result[2]
        };
    }
}

function parseMeta(str: string): View.Meta {
    const regex = /^(.+) \: ((?:\n|.)+)/;
    const result = str.match(regex);

    const occurence = parseOccurence(str);
    if (occurence) {
        const result = occurence.body.match(regex);
        if (result) {
            return {
                judgementForm: "meta",
                index: result[1],
                type: result[2],
                location: occurence.location
            };
        }
    }
}

function parseTerm(str: string): View.Term {
    const regex = /^((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: "term",
            expr: result[1]
        };
    }
}

function parseSort(str: string): View.Sort {
    const regex = /^Sort ((?:\n|.)+)/;
    const occurence = parseOccurence(str);
    if (occurence) {
        const result = occurence.body.match(regex);
        if (result) {
            return {
                judgementForm: "sort",
                index: result[1],
                location: occurence.location
            };
        }
    }
}

function parseBodyItem(str: string): View.BodyItem {
    return parseGoal(str) || parseJudgement(str) || parseMeta(str) || parseSort(str) || parseTerm(str);
}


function parseLocation(str: string): View.Location {
    const regex = /(?:(.+):)?(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+))/;
    const result = str.match(regex);
    if (result) {
        const rowStart = parseInt(result[2]) ? parseInt(result[2]) : parseInt(result[6]);
        const rowEnd   = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[6]);
        const colStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        const colEnd   = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[8]);
        const range = new Range(
            new Point(rowStart - 1, colStart - 1),
            new Point(rowEnd - 1, colEnd - 1)
        );
        return {
            path: parseFilepath(result[1]),
            range: range,
            isSameLine: result[2] === undefined
        };
    }
}

////////////////////////////////////////////////////////////////////////////////
//  Error
////////////////////////////////////////////////////////////////////////////////

function beforePrim(f: (string) => string, s: string) {
    return custom((success, failure) => {
        return (stream, i) => {
            const index = stream.substr(i).indexOf(s);
            if (index !== -1 && i <= stream.length) {
                return success(i + index, f(stream.substr(i, index)));
            } else {
                return failure(i, `'${s}' not found`);
            }
        }
    });
}
const before = (s: string) => beforePrim((x) => x, s);
const beforeAndSkip = (s: string) => before(s).skip(string(s));
const trimBefore = (s: string) => beforePrim((x) => x.trim(), s).skip(spaces);
const trimBeforeAndSkip = (s: string) => trimBefore(s).skip(string(s)).skip(spaces);

const trimResults = (xs: string[]) => xs.map((s) => s.trim());



const spaces = regex(/\s*/);
const token = (s: string) => string(s).skip(spaces);

const identifier = regex(/\S+/).skip(spaces);

const singleLineRange: Parser<[Range, Boolean]> = seq(
        digits,
        string(","),
        digits,
        string("-"),
        digits
    ).map((result) => {
        const row = parseInt(result[0]) - 1;
        const start = new Point(row, parseInt(result[2]) - 1);
        const end   = new Point(row, parseInt(result[4]) - 1);
        return <[Range, Boolean]>[new Range(start, end), true];
    });

const multiLineRange: Parser<[Range, Boolean]> = seq(
        digits,
        string(","),
        digits,
        string("-"),
        digits,
        string(","),
        digits
    ).map((result) => {
        const start = new Point(parseInt(result[0]) - 1, parseInt(result[2]) - 1);
        const end   = new Point(parseInt(result[4]) - 1, parseInt(result[6]) - 1);
        return <[Range, Boolean]>[new Range(start, end), false];
    });

const range = alt(multiLineRange, singleLineRange).skip(spaces);
const location: Parser<View.Location> = seq(
        takeWhile((c) => c !== ":"),
        string(":"),
        range
    ).map((result) => {
        return {
            path: normalize(result[0]),
            range: result[2][0],
            isSameLine: result[2][1]
        };
    }).skip(spaces);

const didYouMean: Parser<View.Suggestion> = alt(seq(
        token("(did you mean"),
        sepBy1(regex(/'.*'/).skip(spaces), token("or")),
        token("?)")
    ), succeed([[], []])).map((result) => {
        return result[1].map((s) => s.substr(1, s.length - 2)); // remove single quotes
    }).skip(spaces);

const notInScope: Parser<View.NotInScope> = seq(
        location,
        token("Not in scope:").then(trimBeforeAndSkip("at")).skip(location),
        didYouMean,
        all
    ).map((result) => {
        return <View.NotInScope>{
            kind: "NotInScope",
            expr: result[1],
            location: result[0],
            suggestion: result[2]
        }
    });

const typeMismatch: Parser<View.TypeMismatch> = seq(
        location,
        alt(trimBeforeAndSkip("!=<"), trimBeforeAndSkip("=<"), trimBeforeAndSkip("!=")),
        trimBeforeAndSkip("of type"),
        trimBeforeAndSkip("when checking that the expression"),
        trimBeforeAndSkip("has type"),
        all
    ).map((result) => {
        return <View.TypeMismatch>{
            kind: "TypeMismatch",
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            exprType: result[5],
            location: result[0]
        };
    });

const definitionTypeMismatch: Parser<View.DefinitionTypeMismatch> = seq(
        location,
        alt(trimBeforeAndSkip("!=<"), trimBeforeAndSkip("=<"), trimBeforeAndSkip("!=")),
        trimBeforeAndSkip("of type"),
        trimBeforeAndSkip("when checking the definition of"),
        all
    ).map((result) => {
        return <View.DefinitionTypeMismatch>{
            kind: "DefinitionTypeMismatch",
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            location: result[0]
        };
    });

const badConstructor: Parser<View.BadConstructor> = seq(
        location,
        token("The constructor").then(trimBeforeAndSkip("does not construct an element of")),
        trimBeforeAndSkip("when checking that the expression"),
        trimBeforeAndSkip("has type"),
        all
    ).map((result) => {
        return <View.BadConstructor>{
            kind: "BadConstructor",
            location: result[0],
            constructor: result[1],
            constructorType: result[2],
            expr: result[3],
            exprType: result[4]
        };
    });

const rhsOmitted: Parser<View.RHSOmitted> =  seq(
        location,
        token("The right-hand side can only be omitted if there is an absurd"),
        token("pattern, () or {}, in the left-hand side."),
        token("when checking that the clause"),
        trimBeforeAndSkip("has type"),
        all
    ).map((result) => {
        return <View.RHSOmitted>{
            kind: "RHSOmitted",
            location: result[0],
            expr: result[4],
            exprType: result[5]
        }
    });

const missingType: Parser<View.MissingType> =  seq(
        location,
        token("Missing type signature for left hand side"),
        trimBeforeAndSkip("when scope checking the declaration"),
        all
    ).map((result) => {
        return <View.MissingType>{
            kind: "MissingType",
            location: result[0],
            expr: result[2]
        }
    });

const multipleDefinition: Parser<View.MultipleDefinition> =  seq(
        location,
        token("Multiple definitions of"),
        trimBeforeAndSkip(". Previous definition at"),
        location,
        token("when scope checking the declaration"),
        trimBeforeAndSkip(":"),
        all
    ).map((result) => {
        return <View.MultipleDefinition>{
            kind: "MultipleDefinition",
            location: result[0],
            locationPrev: result[3],
            expr: result[2],
            decl: result[5],
            declType: result[6]
        }
    });


const missingDefinition: Parser<View.MissingDefinition> =  seq(
        location,
        token("Missing definition for").then(all)
    ).map((result) => {
        return <View.MissingDefinition>{
            kind: "MissingDefinition",
            location: result[0],
            expr: result[1]
        }
    });

const termination: Parser<View.Termination> =  seq(
        location,
        token("Termination checking failed for the following functions:"),
        trimBeforeAndSkip("Problematic calls:"),
        seq(
            trimBeforeAndSkip("(at"),
            location.skip(token(")"))
        ).map((result) => {
            return {
                expr: result[0],
                location: result[1]
            }
        }).atLeast(1)
    ).map((result) => {
        return <View.Termination>{
            kind: "Termination",
            location: result[0],
            expr: result[2],
            calls: result[3]
        }
    });

const constructorTarget: Parser<View.ConstructorTarget> =  seq(
        location,
        token("The target of a constructor must be the datatype applied to its"),
        token("parameters,").then(trimBeforeAndSkip("isn't")),
        token("when checking the constructor").then(trimBeforeAndSkip("in the declaration of")),
        all
    ).map((result) => {
        return <View.ConstructorTarget>{
            kind: "ConstructorTarget",
            location: result[0],
            expr: result[2],
            ctor: result[3],
            decl: result[4]
        }
    });


const functionType: Parser<View.FunctionType> =  seq(
        location,
        trimBeforeAndSkip("should be a function type, but it isn't"),
        token("when checking that").then(trimBeforeAndSkip("is a valid argument to a function of type")),
        all
    ).map((result) => {
        return <View.FunctionType>{
            kind: "FunctionType",
            location: result[0],
            expr: result[2],
            exprType: result[1]
        }
    });

const moduleMismatch: Parser<View.ModuleMismatch> =  seq(
        token("You tried to load").then(trimBeforeAndSkip("which defines")),
        token("the module").then(trimBeforeAndSkip(". However, according to the include path this module")),
        token("should be defined in").then(all)
    ).map((result) => {
        return <View.ModuleMismatch>{
            kind: "ModuleMismatch",
            wrongPath: result[0],
            rightPath: result[2],
            moduleName: result[1]
        }
    });

const parse: Parser<View.Parse> =  seq(
        location,
        trimBeforeAndSkip(": ").then(trimBeforeAndSkip("..."))
    ).map((result) => {
        const i = (<string>result[1]).indexOf("\n");
        return <View.Parse>{
            kind: "Parse",
            location: result[0],
            message: (<string>result[1]).substring(0, i),
            expr: (<string>result[1]).substring(i + 1)
        }
    });


const caseSingleHole: Parser<View.CaseSingleHole> =  seq(
    location,
    token("Right hand side must be a single hole when making a case").then(token("distinction")),
    token("when checking that the expression"),
    trimBeforeAndSkip("has type"),
    all
).map((result) => {
    return <View.CaseSingleHole>{
        kind: "CaseSingleHole",
        location: result[0],
        expr: result[3],
        exprType: result[4]
    }
});

const patternMatchOnNonDatatype: Parser<View.PatternMatchOnNonDatatype> =  seq(
    location,
    token("Cannot pattern match on non-datatype").then(trimBeforeAndSkip("when checking that the expression")),
    trimBeforeAndSkip("has type"),
    all
).map((result) => {
    return <View.PatternMatchOnNonDatatype>{
        kind: "PatternMatchOnNonDatatype",
        location: result[0],
        nonDatatype: result[1],
        expr: result[2],
        exprType: result[3]
    }
});


// function parseCallLocation(str: string): {
//     term: string,
//     location: View.Location
// }[] {
//     const tokens = str.split(/\(at (.*)\)/);
//     return _.chunk(tokens, 2).filter((arr) => arr[0] !== "" ).map((arr) => {
//         return {
//             term: arr[0].trim(),
//             location: parseLocation(arr[1])
//         };
//     });
// }
//
//
//

const unparsed: Parser<View.Unparsed> = all.map((result) => {
    return <View.Unparsed>{
        kind: "Unparsed",
        input: result
    }
});

const errorParser: Parser<View.Error> = alt(
    notInScope,
    typeMismatch,
    definitionTypeMismatch,
    badConstructor,
    rhsOmitted,
    missingType,
    multipleDefinition,
    missingDefinition,
    termination,
    constructorTarget,
    functionType,
    moduleMismatch,
    parse,
    caseSingleHole,
    patternMatchOnNonDatatype,
    unparsed
);

function parseError(input: string): View.Error {
    return errorParser.parse(input).value;
}

export {
    parseContent,
    parseError
}
