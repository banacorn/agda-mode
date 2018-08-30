import * as _ from 'lodash';;
import { parseFilepath } from './../util';
import { Agda, View } from '../../type';

export function parseSolutions(raw: string[]): View.Solutions {
    // examine the first line and see if it's simple or indexed
        // SimpleSolutions:   0  s
        // IndexedSolutions:  1  ?0 := ℕ ?1 := y
    const test = /(\d+)\s+(?:(\?.*)|(.*))/;

    if (raw.length > 1) {
        const result = raw[1].match(test);
        if (result) {
            if (result[2]) {
                return parseIndexedSolutions(raw[0], _.tail(raw));
            } else if (result[3]) {
                return parseSimpleSolutions(raw[0], _.tail(raw));
            }
        }
    } else {
        return {
            kind: 'SimpleSolutions',
            message: raw[0],
            solutions: []
        }
    }
}

function stripPrefixIndex(raw: string) {
    const regex = /(\d+)\s+(.*)/;
    const result = raw.match(regex);
    if (result) {
        return {
            index: parseInt(result[1]),
            expr: result[2]
        };
    } else {
        return {
            index: -1,
            expr: ''
        }
    }
}

function parseSimpleSolutions(message: string, raw: string[]): View.SimpleSolutions {
    const solutions = raw.map(stripPrefixIndex)
    return {
        kind: 'SimpleSolutions',
        message,
        solutions
    };
}

// parsing combination of solutions such as "?0 := ℕ ?1 := y"
function parseIndexedSolutions(message: string, raw: string[]): View.IndexedSolutions {
    const segmentRegex = /\?(\d+)/g;
    const exprRegex = /\?(\d+)\s+\:\=\s+(.*)/;
    const solutions = raw.map(stripPrefixIndex)
        .map(({ index, expr }) => {
            const matches = expr.match(segmentRegex);
            if (matches) {
                const indices = matches.map(match => expr.indexOf(match))
                const combination = indices.map((start, i) => {
                    const end = indices[i + 1];
                    const result = expr.substring(start, end).match(exprRegex);
                    if (result) {
                        const goalIndex = parseInt(result[1]);
                        const expr = result[2];
                        return { goalIndex, expr };
                    }
                });
                return { index, combination }
            } else {
                return { index, combination: [] };
            }
        });
    return {
        kind: 'IndexedSolutions',
        message,
        solutions
    };
}

export function parseJudgements(lines: string): View.Body {
    const {goalAndHave, body, warnings, errors} = divideJudgements(lines.split('\n'));

    const grouped = _.groupBy(concatItems(body).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: concatItems(goalAndHave).map(parseGoalAndHave),
        goals: (grouped['goal'] || []) as View.Goal[],
        judgements: (grouped['type judgement'] || []) as View.Judgement[],
        terms: (grouped['term'] || []) as View.Term[],
        metas: (grouped['meta'] || []) as View.Meta[],
        sorts: (grouped['sort'] || []) as View.Sort[],
        warnings, errors
    }
}


// divide lines into sections
function divideJudgements(lines: string[]): {
    goalAndHave: string[],
    body: string[],
    warnings: string[],
    errors: string[],
} {
    const bodyDelimeterIndex    = lines.indexOf('————————————————————————————————————————————————————————————');
    const warningsDelimeterIndex = lines.indexOf('———— Warnings ——————————————————————————————————————————————');
    const errorsDelimeterIndex   = lines.indexOf('———— Errors ————————————————————————————————————————————————');
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
    } else {
        body = lines.slice(0, lastLineIndex);
    }

    return { goalAndHave, body, warnings, errors };
}

// concatenate multiline judgements
export function concatItems(lines: string[]): string[] {


    function isNewLine({ line, nextLine }): boolean {
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
        || completeJudgement.test(line)
    }


    const newLineIndices = lines.map((line, index) => {
            return {
                line: line,
                nextLine: lines[index + 1],
                index: index
            }
        })
        .filter(obj => isNewLine(obj))
        .map(pair => pair.index)

    const aggregatedLines = newLineIndices.map((index, i) => {
            if (i === newLineIndices.length - 1) {
                // the last inteval
                return [index, lines.length];
            } else {
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


function parseGoalAndHave(str: string): View.GoalAndHave {
    const regex = /^(Goal|Have)\: ((?:\n|.)+)/;
    const result = str.match(regex);
    return {
        label: result[1],
        type: result[2]
    };
}

// Occurence
export interface Occurence {
    range: Agda.Syntax.Range,
    body: string
}

function parseOccurence(str: string): Occurence {
    const regex = /((?:\n|.)*\S+)\s*\[ at (.+):(?:(\d+)\,(\d+)\-(\d+)\,(\d+)|(\d+)\,(\d+)\-(\d+)) \]/;
    const result = str.match(regex);

    if (result) {
        const rowStart = parseInt(result[3]) ? parseInt(result[3]) : parseInt(result[7]);
        const rowEnd   = parseInt(result[5]) ? parseInt(result[5]) : parseInt(result[7]);
        const colStart = parseInt(result[4]) ? parseInt(result[4]) : parseInt(result[8]);
        const colEnd   = parseInt(result[6]) ? parseInt(result[6]) : parseInt(result[9]);
        const interval = {
            start: [rowStart, colStart],
            end  : [rowEnd, colEnd],
        }
        return <Occurence>{
            body: result[1],
            range: {
                source: parseFilepath(result[2]),
                intervals: [interval]
            }
        };
    }
}


function parseGoal(str: string): View.Goal {
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

function parseJudgement(str: string): View.Judgement {
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

function parseMeta(str: string): View.Meta {
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

function parseTerm(str: string): View.Term {
    const regex = /^((?:\n|.)+)/;
    const result = str.match(regex);
    if (result) {
        return {
            judgementForm: 'term',
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
                judgementForm: 'sort',
                index: result[1],
                range: occurence.range
            };
        }
    }
}

export function parseExpression(str: string): View.Expr {
    return parseGoal(str) || parseJudgement(str) || parseMeta(str) || parseSort(str) || parseTerm(str);
}
