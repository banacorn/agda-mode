"use strict";
var _ = require("lodash");
;
var path_1 = require("path");
var util_1 = require("./util");
var parsimmon_1 = require("parsimmon");
var _a = require('atom'), Point = _a.Point, Range = _a.Range;
function parseContent(lines) {
    var _a = divideContent(lines), banner = _a.banner, body = _a.body;
    var bannerItems = concatItems(banner).map(parseBannerItem);
    var bodyItems = concatItems(body).map(parseBodyItem);
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
        var range_1 = new Range(new Point(rowStart - 1, colStart - 1), new Point(rowEnd - 1, colEnd - 1));
        return {
            body: result[1],
            location: {
                path: util_1.parseFilepath(result[2]),
                range: range_1,
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
function parseBodyItem(str) {
    return parseGoal(str) || parseJudgement(str) || parseMeta(str) || parseSort(str) || parseTerm(str);
}
function parseLocation(str) {
    var regex = /(?:(.+):)?(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+))/;
    var result = str.match(regex);
    if (result) {
        var rowStart = parseInt(result[2]) ? parseInt(result[2]) : parseInt(result[6]);
        var rowEnd = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[6]);
        var colStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        var colEnd = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[8]);
        var range_2 = new Range(new Point(rowStart - 1, colStart - 1), new Point(rowEnd - 1, colEnd - 1));
        return {
            path: util_1.parseFilepath(result[1]),
            range: range_2,
            isSameLine: result[2] === undefined
        };
    }
}
////////////////////////////////////////////////////////////////////////////////
//  Error
////////////////////////////////////////////////////////////////////////////////
function beforePrim(f, s) {
    return parsimmon_1.custom(function (success, failure) {
        return function (stream, i) {
            var index = stream.substr(i).indexOf(s);
            if (index !== -1 && i <= stream.length) {
                return success(i + index, f(stream.substr(i, index)));
            }
            else {
                return failure(i, "'" + s + "' not found");
            }
        };
    });
}
var before = function (s) { return beforePrim(function (x) { return x; }, s); };
var beforeAndSkip = function (s) { return before(s).skip(parsimmon_1.string(s)); };
var trimBefore = function (s) { return beforePrim(function (x) { return x.trim(); }, s).skip(spaces); };
var trimBeforeAndSkip = function (s) { return trimBefore(s).skip(parsimmon_1.string(s)).skip(spaces); };
var trimResults = function (xs) { return xs.map(function (s) { return s.trim(); }); };
var spaces = parsimmon_1.regex(/\s*/);
var token = function (s) { return parsimmon_1.string(s).skip(spaces); };
var identifier = parsimmon_1.regex(/\S+/).skip(spaces);
var singleLineRange = parsimmon_1.seq(parsimmon_1.digits, parsimmon_1.string(","), parsimmon_1.digits, parsimmon_1.string("-"), parsimmon_1.digits).map(function (result) {
    var row = parseInt(result[0]) - 1;
    var start = new Point(row, parseInt(result[2]) - 1);
    var end = new Point(row, parseInt(result[4]) - 1);
    return [new Range(start, end), true];
});
var multiLineRange = parsimmon_1.seq(parsimmon_1.digits, parsimmon_1.string(","), parsimmon_1.digits, parsimmon_1.string("-"), parsimmon_1.digits, parsimmon_1.string(","), parsimmon_1.digits).map(function (result) {
    var start = new Point(parseInt(result[0]) - 1, parseInt(result[2]) - 1);
    var end = new Point(parseInt(result[4]) - 1, parseInt(result[6]) - 1);
    return [new Range(start, end), false];
});
var range = parsimmon_1.alt(multiLineRange, singleLineRange).skip(spaces);
var location = parsimmon_1.seq(parsimmon_1.takeWhile(function (c) { return c !== ":"; }), parsimmon_1.string(":"), range).map(function (result) {
    return {
        path: path_1.normalize(result[0]),
        range: result[2][0],
        isSameLine: result[2][1]
    };
}).skip(spaces);
var didYouMean = parsimmon_1.alt(parsimmon_1.seq(token("(did you mean"), parsimmon_1.sepBy1(parsimmon_1.regex(/'.*'/).skip(spaces), token("or")), token("?)")), parsimmon_1.succeed([[], []])).map(function (result) {
    return result[1].map(function (s) { return s.substr(1, s.length - 2); }); // remove single quotes
}).skip(spaces);
var notInScope = parsimmon_1.seq(location, token("Not in scope:").then(trimBeforeAndSkip("at")).skip(location), didYouMean, parsimmon_1.all).map(function (result) {
    return {
        type: 0 /* NotInScope */,
        expr: result[1],
        location: result[0],
        suggestion: result[2]
    };
});
var typeMismatch = parsimmon_1.seq(location, parsimmon_1.alt(trimBeforeAndSkip("!=<"), trimBeforeAndSkip("=<"), trimBeforeAndSkip("!=")), trimBeforeAndSkip("of type"), trimBeforeAndSkip("when checking that the expression"), trimBeforeAndSkip("has type"), parsimmon_1.all).map(function (result) {
    return {
        type: 1 /* TypeMismatch */,
        actual: result[1],
        expected: result[2],
        expectedType: result[3],
        expr: result[4],
        exprType: result[5],
        location: result[0]
    };
});
var wrongConstructor = parsimmon_1.seq(location, token("The constructor").then(trimBeforeAndSkip("does not construct an element of")), trimBeforeAndSkip("when checking that the expression"), trimBeforeAndSkip("has type"), parsimmon_1.all).map(function (result) {
    return {
        type: 2 /* WrongConstructor */,
        constructor: result[1],
        constructorType: result[2],
        expr: result[3],
        exprType: result[4],
        location: result[0]
    };
});
function tempAdapter(parser, input, loc) {
    return parser.parse(input).value;
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
function parseMultipleDefinition(str, loc) {
    var regex = /Multiple definitions of ((?:\n|.)*)\. Previous definition at\n(?:\n|.)*\ scope checking the declaration\n\W*((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        var judgement = parseJudgement(result[2]);
        return {
            type: 6 /* MultipleDefinition */,
            expr: judgement.expr,
            exprType: judgement.type,
            location: loc
        };
    }
}
function parseRhsOmitted(str, loc) {
    var regex = /The right-hand side can only be omitted if there is an absurd\s*pattern\, \(\) or \{\}\, in the left-hand side\.\s*when checking that the clause\s+((?:\n|.)*)\s+has type\s+((?:\n|.)*)/;
    var result = str.match(regex);
    if (result) {
        return {
            type: 7 /* RhsOmitted */,
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
            type: 8 /* ParseError */,
            expr: result[1],
            post: result[2],
            location: loc
        };
    }
}
function parseUnknownError(str) {
    return {
        type: 9 /* Unknown */,
        raw: str
    };
}
var errorParser = parsimmon_1.alt(notInScope, typeMismatch, wrongConstructor);
function parseError(input) {
    console.log(input);
    console.log(errorParser.parse(input));
    // const s = "/Users/banacorn/agda/test/A.agda:28,20-21\n⊤ !=";
    // console.log(s);
    // console.log(errorParser.parse(s));
    return errorParser.parse(input).value;
    // if (strings.length > 0) {
    //     console.log(strings)
    //     const location = parseLocation(strings[0]);
    //
    //
    //     // the first line does not contains Location
    //     const bulk = location ? _.tail(strings).join('\n') : strings.join('\n');
    //
    //     return tempAdapter(notInScope, bulk, location) ||
    //         parseTypeMismatch(bulk, location) ||
    //         parseWrongConstructor(bulk, location) ||
    //         parseApplicationParseError(bulk, location) ||
    //         parseTerminationError(bulk, location) ||
    //         parseMissingDefinition(bulk, location) ||
    //         parseMultipleDefinition(bulk, location) ||
    //         parseRhsOmitted(bulk, location) ||
    //         parseParseError(bulk, location) ||
    //         parseUnknownError(bulk);
    // } else {
    //     return null;
    // }
}
exports.parseError = parseError;
