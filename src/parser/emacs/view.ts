import * as _ from 'lodash';;
import { parseFilepath } from './../util';
import { Agda, View } from '../../type';


var reParseAllGoalsWarningsOld = require('../../Reason/Emacs.bs').jsParseAllGoalsWarningsOld;
var reParseGoalTypeContext = require('../../Reason/Emacs.bs').jsParseGoalTypeContext;
var reConcatLines = require('../../Reason/Emacs.bs').jsConcatLines;

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

export function parseAllGoalsWarnings(title: string, lines: string): View.EmacsMetas {
    const [metas, warnings, errors] = reParseAllGoalsWarningsOld(title, lines);
    const grouped = _.groupBy(reConcatLines(metas).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: null,
        goals: (grouped['goal'] || []) as View.Goal[],
        judgements: (grouped['type judgement'] || []) as View.Judgement[],
        terms: (grouped['term'] || []) as View.Term[],
        metas: (grouped['meta'] || []) as View.Meta[],
        sorts: (grouped['sort'] || []) as View.Sort[],
        warnings, errors
    }
}

export function parseGoalTypeContext(lines: string): View.EmacsMetas {
    const [goal, have, metas] = reParseGoalTypeContext(lines);
    const grouped = _.groupBy(reConcatLines(metas).map(parseExpression), 'judgementForm');
    return {
        goalAndHave: {
            goal, have
        },
        goals: (grouped['goal'] || []) as View.Goal[],
        judgements: (grouped['type judgement'] || []) as View.Judgement[],
        terms: (grouped['term'] || []) as View.Term[],
        metas: (grouped['meta'] || []) as View.Meta[],
        sorts: (grouped['sort'] || []) as View.Sort[],
        warnings: [],
        errors: []
    }
}


////////////////////////////////////////////////////////////////////////////////
//  Components
////////////////////////////////////////////////////////////////////////////////


// Occurence
export interface Occurence {
    range: Agda.Range,
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
