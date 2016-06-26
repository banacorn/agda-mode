import * as _ from "lodash";;
import { parseFilepath } from "./util";
import { View } from "../types";

var { Point, Range } = require('atom');


function parseHeaderItem(str: string): View.Header {
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
            index: parseInt(result[1]),
            type: result[2]
        };
    }
}

function parseJudgement(str: string): View.Judgement {
    const regex = /^([^\_\?].*) \: ((?:\n|.)+)/;
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
                index: parseInt(result[1]),
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
                index: parseInt(result[1]),
                location: occurence.location
            };
        }
    }
}

function parseItem(str: string): View.Item {
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

function parseNotInScope(str: string): any {
    const regex = /Not in scope\:\s+((?:\n|.)*)\s+at/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "not in scope",
            expr: result[1]
        };
    }
}

function parseTypeMismatch(str: string): any {
    const regex = /((?:\n|.)*)\s+\!\=\<?\s+((?:\n|.)*)\s+of type\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "type mismatch",
            expected: result[2],
            actual: result[1],
            type: result[3],
            expr: result[4],
            exprType: result[5]
        };
    }
}

function parseWrongConstructor(str: string): any {
    const regex = /The constructor\s+((?:\n|.)*)\s+does not construct an element of\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "wrong constructor",
            constructor: result[1],
            constructorType: result[2],
            expr: result[3],
            exprType: result[4]
        };
    }
}

function parseApplicationParseError(str: string): any {
    const regex = /Could not parse the application\s+((?:\n|.)*)\s+when scope checking\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "application parse error",
            expr: result[1]
        };
    }
}

function parseCallLocation(str: string): any {
    let result = [];
    const tokens = str.split(/\(at (.*)\)/);
    tokens.forEach((token, i) => {
        if (token !== "" && i % 2 === 0) {
            result[Math.floor(i/2)] = {
                term: token.trim()
            };
        } else if (token) {
            result[Math.floor(i/2)].location = parseLocation(token)
        }
    });
    return result;
}


function parseTerminationError(str: string): any {
    const regex = /Termination checking failed for the following functions:\s+((?:\n|.)*)\s+Problematic calls:\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "termination error",
            expr: result[1],
            calls: parseCallLocation(result[2])
        };
    }
}

function parseMissingDefinition(str: string): any {
    const regex = /Missing definition for\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "missing definition",
            expr: result[1]
        };
    }
}

function parseRhsOmitted(str: string): any {
    const regex = /The right-hand side can only be omitted if there is an absurd\s*pattern\, \(\) or \{\}\, in the left-hand side\.\s*when checking that the clause\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "rhs omitted",
            expr: result[1],
            type: result[2]
        };
    }
}


function parseParseError(str: string): any {
    const regex = /Parse error\s+((?:\n|.)*)\<ERROR\>\s+((?:\n|.)*)\.\.\./
    const result = str.match(regex);
    if (result) {
        return {
            errorType: "parse error",
            expr: result[1],
            post: result[2]
        };
    }
}

function parseUnknownError(str: string): any {
    return {
        errorType: 'unknown',
        raw: str
    };
}

function parseError(strings: string[]): any {
    const location = parseLocation(strings[0]);


    // the first line does not contains Location
    const bulk = location ? _.tail(strings).join('\n') : strings.join('\n');

    const result = parseNotInScope(bulk) ||
        parseTypeMismatch(bulk) ||
        parseWrongConstructor(bulk) ||
        parseApplicationParseError(bulk) ||
        parseTerminationError(bulk) ||
        parseMissingDefinition(bulk) ||
        parseRhsOmitted(bulk) ||
        parseParseError(bulk) ||
        parseUnknownError(bulk);
    result.location = location;
    return result;
}

export {
    parseHeaderItem,
    parseItem,
    parseError
}
