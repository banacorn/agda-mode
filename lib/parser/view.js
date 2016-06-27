"use strict";
var _ = require("lodash");
;
var util_1 = require("./util");
var _a = require('atom'), Point = _a.Point, Range = _a.Range;
function parseContent(lines) {
    var _a = divideContent(lines), banner = _a.banner, body = _a.body;
    var bannerItems = concatItems(banner).map(parseBannerItem);
    var bodyItems = concatItems(body).map(parseItem);
    return {
        banner: bannerItems,
        body: bodyItems
    };
}
exports.parseContent = parseContent;
// divide content into header and body
function divideContent(lines) {
    var notEmpty = lines.length > 0;
    var index = lines.indexOf("————————————————————————————————————————————————————————————");
    var isSectioned = index !== -1;
    if (notEmpty && isSectioned) {
        return {
            banner: lines.slice(0, index),
            body: lines.slice(index + 1, lines.length)
        };
    }
    else {
        return {
            banner: [],
            body: lines
        };
    }
}
// concatenate multiline judgements
function concatItems(lines) {
    var newlineRegex = /^(?:Goal\:|Have\:|\S+\s+\:\s*|Sort) \S*/;
    var result = [];
    var currentLine = 0;
    lines.forEach(function (line, i) {
        var notTheLastLine = i + 1 < lines.length;
        var preemptLine = notTheLastLine ? line + "\n" + lines[i + 1] : line;
        if (line.match(newlineRegex) || preemptLine.match(newlineRegex)) {
            // is a new line
            currentLine = i;
            result[currentLine] = line;
        }
        else {
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
function parseBannerItem(str) {
    var regex = /^(Goal|Have)\: ((?:\n|.)+)/;
    var result = str.match(regex);
    return {
        label: result[1],
        type: result[2]
    };
}
function parseOccurence(str) {
    var regex = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/;
    var result = str.match(regex);
    if (result) {
        var rowStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        var rowEnd = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[7]);
        var colStart = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[8]);
        var colEnd = parseInt(result[6]) ? parseInt(result[6]) : parseInt(result[9]);
        var range = new Range(new Point(rowStart - 1, colStart - 1), new Point(rowEnd - 1, colEnd - 1));
        return {
            body: result[1],
            location: {
                path: util_1.parseFilepath(result[2]),
                range: range,
                isSameLine: result[3] === undefined
            }
        };
    }
}
function parseGoal(str) {
    var regex = /^(\?\d+) \: ((?:\n|.)+)/;
    var result = str.match(regex);
    if (result) {
        return {
            judgementForm: "goal",
            index: result[1],
            type: result[2]
        };
    }
}
function parseJudgement(str) {
    var regex = /^(?:([^\_\?](?:\n|.)*)) \: ((?:\n|.)+)/;
    var result = str.match(regex);
    if (result) {
        return {
            judgementForm: "type judgement",
            expr: result[1],
            type: result[2]
        };
    }
}
function parseMeta(str) {
    var regex = /^(.+) \: ((?:\n|.)+)/;
    var result = str.match(regex);
    var occurence = parseOccurence(str);
    if (occurence) {
        var result_1 = occurence.body.match(regex);
        if (result_1) {
            return {
                judgementForm: "meta",
                index: result_1[1],
                type: result_1[2],
                location: occurence.location
            };
        }
    }
}
function parseTerm(str) {
    var regex = /^((?:\n|.)+)/;
    var result = str.match(regex);
    if (result) {
        return {
            judgementForm: "term",
            expr: result[1]
        };
    }
}
function parseSort(str) {
    var regex = /^Sort ((?:\n|.)+)/;
    var occurence = parseOccurence(str);
    if (occurence) {
        var result = occurence.body.match(regex);
        if (result) {
            return {
                judgementForm: "sort",
                index: result[1],
                location: occurence.location
            };
        }
    }
}
function parseItem(str) {
    return parseGoal(str) || parseJudgement(str) || parseMeta(str) || parseSort(str) || parseTerm(str);
}
exports.parseItem = parseItem;
function parseLocation(str) {
    var regex = /(?:(.+):)?(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+))/;
    var result = str.match(regex);
    if (result) {
        var rowStart = parseInt(result[2]) ? parseInt(result[2]) : parseInt(result[6]);
        var rowEnd = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[6]);
        var colStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        var colEnd = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[8]);
        var range = new Range(new Point(rowStart - 1, colStart - 1), new Point(rowEnd - 1, colEnd - 1));
        return {
            path: util_1.parseFilepath(result[1]),
            range: range,
            isSameLine: result[2] === undefined
        };
    }
}
////////////////////////////////////////////////////////////////////////////////
//  Error
////////////////////////////////////////////////////////////////////////////////
function parseNotInScope(str, loc) {
    var regex = /Not in scope\:\s+((?:\n|.)*)\s+at/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 0 /* NotInScope */,
            expr: result[1],
            location: loc
        };
    }
}
function parseTypeMismatch(str, loc) {
    var regex = /((?:\n|.)*)\s+\!\=\<?\s+((?:\n|.)*)\s+of type\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 1 /* TypeMismatch */,
            actual: result[1],
            expected: result[2],
            expectedType: result[3],
            expr: result[4],
            exprType: result[5],
            location: loc
        };
    }
}
function parseWrongConstructor(str, loc) {
    var regex = /The constructor\s+((?:\n|.)*)\s+does not construct an element of\s+((?:\n|.)*)\s+when checking that the expression\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 2 /* WrongConstructor */,
            constructor: result[1],
            constructorType: result[2],
            expr: result[3],
            exprType: result[4],
            location: loc
        };
    }
}
function parseApplicationParseError(str, loc) {
    var regex = /Could not parse the application\s+((?:\n|.)*)\s+when scope checking\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 3 /* ApplicationParseError */,
            expr: result[1],
            location: loc
        };
    }
}
function parseCallLocation(str) {
    var tokens = str.split(/\(at (.*)\)/);
    return _.chunk(tokens, 2).filter(function (arr) { return arr[0] !== ""; }).map(function (arr) {
        return {
            term: arr[0].trim(),
            location: parseLocation(arr[1])
        };
    });
}
function parseTerminationError(str, loc) {
    var regex = /Termination checking failed for the following functions:\s+((?:\n|.)*)\s+Problematic calls:\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 4 /* TerminationError */,
            expr: result[1],
            calls: parseCallLocation(result[2]),
            location: loc
        };
    }
}
function parseMissingDefinition(str, loc) {
    var regex = /Missing definition for\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 5 /* MissingDefinition */,
            expr: result[1],
            location: loc
        };
    }
}
function parseRhsOmitted(str, loc) {
    var regex = /The right-hand side can only be omitted if there is an absurd\s*pattern\, \(\) or \{\}\, in the left-hand side\.\s*when checking that the clause\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 6 /* RhsOmitted */,
            expr: result[1],
            exprType: result[2],
            location: loc
        };
    }
}
function parseParseError(str, loc) {
    var regex = /Parse error\s+((?:\n|.)*)\<ERROR\>\s+((?:\n|.)*)\.\.\./;
    var result = str.match(regex);
    if (result) {
        return {
            type: 7 /* ParseError */,
            expr: result[1],
            post: result[2],
            location: loc
        };
    }
}
function parseUnknownError(str) {
    return {
        type: 8 /* Unknown */,
        raw: str
    };
}
function parseError(strings) {
    var location = parseLocation(strings[0]);
    // the first line does not contains Location
    var bulk = location ? _.tail(strings).join('\n') : strings.join('\n');
    var result = parseNotInScope(bulk, location) ||
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
exports.parseError = parseError;
