"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
;
const util_1 = require("./util");
const atom_1 = require("atom");
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
function parseJudgements(lines) {
    const { goalAndHave, body, warnings, errors } = divideJudgements(lines);
    const grouped = _.groupBy(concatItems(body).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: concatItems(goalAndHave).map(parseGoalAndHave),
        goals: (grouped['goal'] || []),
        judgements: (grouped['type judgement'] || []),
        terms: (grouped['term'] || []),
        metas: (grouped['meta'] || []),
        sorts: (grouped['sort'] || []),
        warnings, errors
    };
}
exports.parseJudgements = parseJudgements;
// divide lines into sections
function divideJudgements(lines) {
    const bodyDelimeterIndex = lines.indexOf('————————————————————————————————————————————————————————————');
    const warningsDelimeterIndex = lines.indexOf('———— Warnings ——————————————————————————————————————————————');
    const errorsDelimeterIndex = lines.indexOf('———— Errors ————————————————————————————————————————————————');
    let lastLineIndex = lines.length;
    let goalAndHave = [];
    let body = [];
    let warnings = [];
    let errors = [];
    // starts segregating lines from the end, update lastLineIndex as we progress
    // there are errors
    if (errorsDelimeterIndex !== -1) {
        errors = lines.slice(errorsDelimeterIndex + 1, lastLineIndex);
        lastLineIndex = errorsDelimeterIndex;
    }
    // there are warnings
    if (warningsDelimeterIndex !== -1) {
        warnings = lines.slice(warningsDelimeterIndex + 1, lastLineIndex);
        lastLineIndex = warningsDelimeterIndex;
    }
    // there is the body & the Goal & Have brothers
    if (bodyDelimeterIndex !== -1) {
        body = lines.slice(bodyDelimeterIndex + 1, lastLineIndex);
        goalAndHave = lines.slice(0, bodyDelimeterIndex);
        // there is only the body
    }
    else {
        body = lines.slice(0, lastLineIndex);
    }
    return { goalAndHave, body, warnings, errors };
}
// concatenate multiline judgements
function concatItems(lines) {
    function isNewLine({ line, nextLine }) {
        //      Goal: Banana
        const goal = /^Goal\: \S*/;
        //      Have: Banana
        const have = /^Have\: \S*/;
        //      Sort 123
        const sort = /^Sort \S*/;
        //      banana : Banana
        const completeJudgement = /^[^\(\{\s]+\s+\:\s* \S*/;
        // case when the term's name is too long, the rest of the judgement
        // would go to the next line, e.g:
        //      banananananananananananananananana
        //          : Banana
        const reallyLongTermIdentifier = /^\S+$/;
        const restOfTheJudgement = /^\s*\:\s* \S*/;
        // console.log(`%c${line}`, 'color: green')
        // console.log(`reallyLongTermIdentifier: ${reallyLongTermIdentifier.test(line)}`)
        // console.log(`restOfTheJudgement: ${(nextLine && restOfTheJudgement.test(nextLine))}`)
        // console.log(`completeJudgement: ${completeJudgement.test(line)}`)
        return goal.test(line)
            || have.test(line)
            || sort.test(line)
            || reallyLongTermIdentifier.test(line) && (nextLine && restOfTheJudgement.test(nextLine))
            || completeJudgement.test(line);
    }
    const newLineIndices = lines.map((line, index) => {
        return {
            line: line,
            nextLine: lines[index + 1],
            index: index
        };
    })
        .filter(obj => isNewLine(obj))
        .map(pair => pair.index);
    const aggregatedLines = newLineIndices.map((index, i) => {
        if (i === newLineIndices.length - 1) {
            // the last inteval
            return [index, lines.length];
        }
        else {
            return [index, newLineIndices[i + 1]];
        }
    }).map(interval => {
        return lines.slice(interval[0], interval[1]).join('\n');
    });
    return aggregatedLines;
}
////////////////////////////////////////////////////////////////////////////////
//  Components
////////////////////////////////////////////////////////////////////////////////
function parseGoalAndHave(str) {
    const regex = /^(Goal|Have)\: ((?:\n|.)+)/;
    const result = str.match(regex);
    return {
        label: result[1],
        type: result[2]
    };
}
function parseOccurence(str) {
    const regex = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/;
    const result = str.match(regex);
    if (result) {
        const rowStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        const rowEnd = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[7]);
        const colStart = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[8]);
        const colEnd = parseInt(result[6]) ? parseInt(result[6]) : parseInt(result[9]);
        const range = new atom_1.Range(new atom_1.Point(rowStart - 1, colStart - 1), new atom_1.Point(rowEnd - 1, colEnd - 1));
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
                location: occurence.location
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
                location: occurence.location
            };
        }
    }
}
function parseExpression(str) {
    return parseGoal(str) || parseJudgement(str) || parseMeta(str) || parseSort(str) || parseTerm(str);
}
//# sourceMappingURL=view.js.map