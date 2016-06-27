import * as _ from "lodash";;
import { parseFilepath } from "./util";
import { View } from "../types";

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

function parseNotInScope(str: string, loc: View.Location): View.NotInScopeError {
    const regex = /Not in scope\:\s+((?:\n|.)*)\s+at/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.NotInScope,
            expr: result[1],
            location: loc
        };
    }
}

function parseTypeMismatch(str: string, loc: View.Location): View.TypeMismatch {
    const regex = /((?:\n|.)*)\s+\!\=\<?\s+((?:\n|.)*)\s+of type\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.TypeMismatch,
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            exprType: result[5],
            location: loc
        };
    }
}

function parseWrongConstructor(str: string, loc: View.Location): View.WrongConstructor {
    const regex = /The constructor\s+((?:\n|.)*)\s+does not construct an element of\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.WrongConstructor,
            constructor: result[1],
            constructorType: result[2],
            expr: result[3],
            exprType: result[4],
            location: loc
        };
    }
}

function parseApplicationParseError(str: string, loc: View.Location): View.ApplicationParseError {
    const regex = /Could not parse the application\s+((?:\n|.)*)\s+when scope checking\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.ApplicationParseError,
            expr: result[1],
            location: loc
        };
    }
}

function parseCallLocation(str: string): {
    term: string,
    location: View.Location
}[] {
    const tokens = str.split(/\(at (.*)\)/);
    return _.chunk(tokens, 2).filter((arr) => arr[0] !== "" ).map((arr) => {
        return {
            term: arr[0].trim(),
            location: parseLocation(arr[1])
        };
    });
}


function parseTerminationError(str: string, loc: View.Location): View.TerminationError {
    const regex = /Termination checking failed for the following functions:\s+((?:\n|.)*)\s+Problematic calls:\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.TerminationError,
            expr: result[1],
            calls: parseCallLocation(result[2]),
            location: loc
        };
    }
}

function parseMissingDefinition(str: string, loc: View.Location): View.MissingDefinition {
    const regex = /Missing definition for\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.MissingDefinition,
            expr: result[1],
            location: loc
        };
    }
}

function parseRhsOmitted(str: string, loc: View.Location): View.RhsOmitted {
    const regex = /The right-hand side can only be omitted if there is an absurd\s*pattern\, \(\) or \{\}\, in the left-hand side\.\s*when checking that the clause\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.RhsOmitted,
            expr: result[1],
            exprType: result[2],
            location: loc
        };
    }
}


function parseParseError(str: string, loc: View.Location): View.ParseError {
    const regex = /Parse error\s+((?:\n|.)*)\<ERROR\>\s+((?:\n|.)*)\.\.\./
    const result = str.match(regex);
    if (result) {
        return {
            type: View.ErrorType.ParseError,
            expr: result[1],
            post: result[2],
            location: loc
        };
    }
}

function parseUnknownError(str: string): View.Unknown {
    return {
        type: View.ErrorType.Unknown,
        raw: str
    };
}

function parseError(strings: string[]): View.Error {
    const location = parseLocation(strings[0]);


    // the first line does not contains Location
    const bulk = location ? _.tail(strings).join('\n') : strings.join('\n');

    const result = parseNotInScope(bulk, location) ||
        parseTypeMismatch(bulk, location) ||
        parseWrongConstructor(bulk, location) ||
        parseApplicationParseError(bulk, location) ||
        parseTerminationError(bulk, location) ||
        parseMissingDefinition(bulk, location) ||
        parseRhsOmitted(bulk, location) ||
        parseParseError(bulk, location) ||
        parseUnknownError(bulk);
    return result;
}

export {
    parseContent,
    parseError
}
