"use strict";
;
var util_1 = require("./util");
var _a = require('atom'), Point = _a.Point, Range = _a.Range;
function parseJudgements(lines) {
    var _a = divideJudgements(lines), banner = _a.banner, body = _a.body;
    var bannerItems = concatItems(banner).map(parseBannerItem);
    var bodyItems = concatItems(body).map(parseBodyItem);
    return {
        banner: bannerItems,
        body: bodyItems
    };
}
exports.parseJudgements = parseJudgements;
// divide content into header and body
function divideJudgements(lines) {
    var notEmpty = lines.length > 0;
    var index = lines.indexOf('————————————————————————————————————————————————————————————');
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
    function isNewLine(_a) {
        var line = _a.line, nextLine = _a.nextLine, index = _a.index;
        //      Goal: Banana
        var goal = /^Goal\: \S*/;
        //      Have: Banana
        var have = /^Have\: \S*/;
        //      Sort 123
        var sort = /^Sort \S*/;
        //      banana : Banana
        var completeJudgement = /^[^\(\{\s]+\s+\:\s* \S*/;
        // case when the term's name is too long, the rest of the judgement
        // would go to the next line, e.g:
        //      banananananananananananananananana
        //          : Banana
        var reallyLongTermIdentifier = /^\S+$/;
        var restOfTheJudgement = /^\s*\:\s* \S*/;
        // console.log(`%c${line}`, 'color: green')
        // console.log(`reallyLongTermIdentifier: ${reallyLongTermIdentifier.test(line)}`)
        // console.log(`restOfTheJudgement: ${(nextLine && restOfTheJudgement.test(nextLine))}`)
        return goal.test(line)
            || have.test(line)
            || sort.test(line)
            || reallyLongTermIdentifier.test(line) && (nextLine && restOfTheJudgement.test(nextLine))
            || completeJudgement.test(line);
    }
    var newLineIndices = lines.map(function (line, index) {
        return {
            line: line,
            nextLine: lines[index + 1],
            index: index
        };
    })
        .filter(function (obj) { return isNewLine(obj); })
        .map(function (pair) { return pair.index; });
    var aggregatedLines = newLineIndices.map(function (index, i) {
        if (i === newLineIndices.length - 1) {
            // the last inteval
            return [index, lines.length];
        }
        else {
            return [index, newLineIndices[i + 1]];
        }
    }).map(function (interval) {
        return lines.slice(interval[0], interval[1]).join('\n');
    });
    return aggregatedLines;
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
            judgementForm: 'goal',
            index: result[1],
            type: result[2]
        };
    }
}
function parseJudgement(str) {
    var regex = /^(?:([^\_\?](?:[^\:])*)) \: ((?:\n|.)+)/;
    var result = str.match(regex);
    if (result) {
        return {
            judgementForm: 'type judgement',
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
                judgementForm: 'meta',
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
            judgementForm: 'term',
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
                judgementForm: 'sort',
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
        var range = new Range(new Point(rowStart - 1, colStart - 1), new Point(rowEnd - 1, colEnd - 1));
        return {
            path: util_1.parseFilepath(result[1]),
            range: range,
            isSameLine: result[2] === undefined
        };
    }
}
//# sourceMappingURL=view.js.map