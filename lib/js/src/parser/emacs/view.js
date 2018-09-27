"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
;
const util_1 = require("./../util");
var reParseAllGoalsWarnings = require('../../view/component/Reason/Emacs.bs').jsParseAllGoalsWarnings;
var reParseGoalTypeContext = require('../../view/component/Reason/Emacs.bs').jsParseGoalTypeContext;
var reConcatLines = require('../../view/component/Reason/Emacs.bs').jsConcatLines;
function parseSolutions(raw) {
    // examine the first line and see if it's simple or indexed
    // SimpleSolutions:   0  s
    // IndexedSolutions:  1  ?0 := ℕ ?1 := y
    const test = /(\d+)\s+(?:(\?.*)|(.*))/;
    if (raw.length > 1) {
        const result = raw[1].match(test);
        if (result) {
            if (result[2]) {
                return parseIndexedSolutions(raw[0], _.tail(raw));
            }
            else if (result[3]) {
                return parseSimpleSolutions(raw[0], _.tail(raw));
            }
        }
    }
    else {
        return {
            kind: 'SimpleSolutions',
            message: raw[0],
            solutions: []
        };
    }
}
exports.parseSolutions = parseSolutions;
function stripPrefixIndex(raw) {
    const regex = /(\d+)\s+(.*)/;
    const result = raw.match(regex);
    if (result) {
        return {
            index: parseInt(result[1]),
            expr: result[2]
        };
    }
    else {
        return {
            index: -1,
            expr: ''
        };
    }
}
function parseSimpleSolutions(message, raw) {
    const solutions = raw.map(stripPrefixIndex);
    return {
        kind: 'SimpleSolutions',
        message,
        solutions
    };
}
// parsing combination of solutions such as "?0 := ℕ ?1 := y"
function parseIndexedSolutions(message, raw) {
    const segmentRegex = /\?(\d+)/g;
    const exprRegex = /\?(\d+)\s+\:\=\s+(.*)/;
    const solutions = raw.map(stripPrefixIndex)
        .map(({ index, expr }) => {
        const matches = expr.match(segmentRegex);
        if (matches) {
            const indices = matches.map(match => expr.indexOf(match));
            const combination = indices.map((start, i) => {
                const end = indices[i + 1];
                const result = expr.substring(start, end).match(exprRegex);
                if (result) {
                    const goalIndex = parseInt(result[1]);
                    const expr = result[2];
                    return { goalIndex, expr };
                }
            });
            return { index, combination };
        }
        else {
            return { index, combination: [] };
        }
    });
    return {
        kind: 'IndexedSolutions',
        message,
        solutions
    };
}
function parseAllGoalsWarnings(title, lines) {
    // const {goalAndHave, metas, warnings, errors} = parseAllGoalsWarnings(title, lines);
    const [metas, warnings, errors] = reParseAllGoalsWarnings(title, lines);
    const grouped = _.groupBy(reConcatLines(metas).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: null,
        goals: (grouped['goal'] || []),
        judgements: (grouped['type judgement'] || []),
        terms: (grouped['term'] || []),
        metas: (grouped['meta'] || []),
        sorts: (grouped['sort'] || []),
        warnings, errors
    };
}
exports.parseAllGoalsWarnings = parseAllGoalsWarnings;
function parseGoalTypeContext(lines) {
    const [goal, have, metas] = reParseGoalTypeContext(lines);
    const grouped = _.groupBy(reConcatLines(metas).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: {
            goal, have
        },
        goals: (grouped['goal'] || []),
        judgements: (grouped['type judgement'] || []),
        terms: (grouped['term'] || []),
        metas: (grouped['meta'] || []),
        sorts: (grouped['sort'] || []),
        warnings: [],
        errors: []
    };
}
exports.parseGoalTypeContext = parseGoalTypeContext;
function parseOccurence(str) {
    const regex = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/;
    const result = str.match(regex);
    if (result) {
        const rowStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        const rowEnd = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[7]);
        const colStart = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[8]);
        const colEnd = parseInt(result[6]) ? parseInt(result[6]) : parseInt(result[9]);
        const interval = {
            start: [rowStart, colStart],
            end: [rowEnd, colEnd],
        };
        return {
            body: result[1],
            range: {
                source: util_1.parseFilepath(result[2]),
                intervals: [interval]
            }
        };
    }
}
function parseGoal(str) {
    const regex = /^(\?\d+) \: ((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: 'goal',
            index: result[1],
            type: result[2]
        };
    }
}
function parseJudgement(str) {
    const regex = /^(?:([^\_\?](?:[^\:])*)) \: ((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: 'type judgement',
            expr: result[1],
            type: result[2]
        };
    }
}
function parseMeta(str) {
    const regex = /^(.+) \: ((?:\n|.)+)/;
    const occurence = parseOccurence(str);
    if (occurence) {
        const result = occurence.body.match(regex);
        if (result) {
            return {
                judgementForm: 'meta',
                index: result[1],
                type: result[2],
                range: occurence.range
            };
        }
    }
}
function parseTerm(str) {
    const regex = /^((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: 'term',
            expr: result[1]
        };
    }
}
function parseSort(str) {
    const regex = /^Sort ((?:\n|.)+)/;
    const occurence = parseOccurence(str);
    if (occurence) {
        const result = occurence.body.match(regex);
        if (result) {
            return {
                judgementForm: 'sort',
                index: result[1],
                range: occurence.range
            };
        }
    }
}
function parseExpression(str) {
    return parseGoal(str) || parseJudgement(str) || parseMeta(str) || parseSort(str) || parseTerm(str);
}
exports.parseExpression = parseExpression;
//# sourceMappingURL=view.js.map