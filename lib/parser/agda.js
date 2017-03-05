"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function parseAgdaResponse(raw) {
    const tokens = parseSExpression(raw);
    switch (tokens[0]) {
        case 'agda2-info-action':
            let type = parseInfoActionType(tokens[1]);
            let content = tokens.length === 3 ? [] : _.compact(tokens[2].split('\\n'));
            return {
                kind: 'InfoAction',
                infoActionKind: type,
                content: content
            };
        case 'agda2-status-action':
            return {
                kind: 'StatusAction',
                content: tokens.slice(1, 2)
            };
        case 'agda2-goals-action':
            return {
                kind: 'GoalsAction',
                content: tokens[1].map((s) => parseInt(s))
            };
        case 'agda2-give-action':
            let index = parseInt(tokens[1]);
            // with parenthesis: ["agda2-give-action", 1, "paren"]
            // w/o  parenthesis: ["agda2-give-action", 1, "no-paren"]
            // with content    : ["agda2-give-action", 0, ...]
            switch (tokens[2]) {
                case 'paren': return {
                    kind: 'GiveAction',
                    index: index,
                    content: '',
                    hasParenthesis: true
                };
                case 'no-paren': return {
                    kind: 'GiveAction',
                    index: index,
                    content: '',
                    hasParenthesis: false
                };
                default: return {
                    kind: 'GiveAction',
                    index: index,
                    content: tokens[2],
                    hasParenthesis: false
                };
            }
        case 'agda2-parse-error':
            return {
                kind: 'ParseError',
                content: tokens.slice(1)
            };
        case 'agda2-goto':
        case 'agda2-maybe-goto':
            return {
                kind: 'Goto',
                filepath: tokens[1][0],
                position: parseInt(tokens[1][2])
            };
        case 'agda2-solveAll-action':
            return {
                kind: 'SolveAllAction',
                solutions: _.chunk(tokens[1], 2).map((arr) => {
                    return { index: parseInt(arr[0]), expression: arr[1] };
                })
            };
        case 'agda2-make-case-action':
            return {
                kind: 'MakeCaseAction',
                content: tokens[1]
            };
        case 'agda2-make-case-action-extendlam':
            return {
                kind: 'MakeCaseActionExtendLam',
                content: tokens[1]
            };
        case 'agda2-highlight-clear':
            return {
                kind: 'HighlightClear',
            };
        case 'agda2-highlight-add-annotations':
            let annotations = _
                .tail(tokens)
                .map(parseAnnotation);
            return {
                kind: 'HighlightAddAnnotations',
                content: annotations
            };
        case 'agda2-highlight-load-and-delete-action':
            return {
                kind: 'HighlightLoadAndDeleteAction',
                content: tokens[1]
            };
        default:
            return {
                kind: 'UnknownAction',
                content: tokens
            };
    }
}
exports.parseAgdaResponse = parseAgdaResponse;
function parseInfoActionType(s) {
    switch (s) {
        case '*All Goals*': return 'AllGoals';
        case '*All Done*': return 'AllGoals'; // since Agda-2.6
        case '*Error*': return 'Error';
        case '*Type-checking*': return 'TypeChecking';
        case '*Current Goal*': return 'CurrentGoal';
        case '*Inferred Type*': return 'InferredType';
        case '*Module contents*': return 'ModuleContents';
        case '*Context*': return 'Context';
        case '*Goal type etc.*': return 'GoalTypeEtc';
        case '*Normal Form*': return 'NormalForm';
        case '*Intro*': return 'Intro';
        case '*Auto*': return 'Auto';
        case '*Constraints*': return 'Constraints';
        case '*Scope Info*': return 'ScopeInfo';
        default: return 'Unknown';
    }
}
function parseAnnotation(obj) {
    if (obj[4]) {
        return {
            start: obj[0],
            end: obj[1],
            type: obj[2],
            source: {
                filepath: obj[4][0],
                index: obj[4][2]
            }
        };
    }
    else {
        return {
            start: obj[0],
            end: obj[1],
            type: obj[2]
        };
    }
}
exports.parseAnnotation = parseAnnotation;
////////////////////////////////////////////////////////////////////////////////
//  Parsing S-Expressions
////////////////////////////////////////////////////////////////////////////////
function parse_sexp(string) {
    var sexp = [[]];
    var word = '';
    var in_str = false;
    function pushInLast(elem) {
        sexp[sexp.length - 1].push(elem);
    }
    for (var i = 0; i < string.length; i++) {
        var char = string[i];
        if (char == '\'' && !in_str) {
            // drop all single quotes: 'param => param
        }
        else if (char == '(' && !in_str) {
            sexp.push([]);
        }
        else if (char == ')' && !in_str) {
            if (word != '') {
                pushInLast(word);
                word = '';
            }
            pushInLast(sexp.pop());
        }
        else if (char == ' ' && !in_str) {
            if (word != '') {
                pushInLast(word);
                word = '';
            }
        }
        else if (char == '\"') {
            in_str = !in_str;
        }
        else {
            word += char;
        }
    }
    return sexp[0];
}
function parseSExpression(s) {
    return parse_sexp(preprocess(s))[0];
}
exports.parseSExpression = parseSExpression;
function preprocess(chunk) {
    // polyfill String::startsWith
    if (chunk.substr(0, 6) === '((last') {
        // drop wierd prefix like ((last . 1))
        let index = chunk.indexOf('(agda');
        let length = chunk.length;
        chunk = chunk.substring(index, length - 1);
    }
    if (chunk.substr(0, 13) === 'cannot read: ') {
        // handles Agda parse error
        chunk = chunk.substring(12);
        chunk = `(agda2-parse-error${chunk})`;
    }
    // Replace window's \\ in paths with /, so that \n doesn't get treated as newline.
    chunk = chunk.replace(/\\\\/g, "/");
    return chunk;
}
//# sourceMappingURL=agda.js.map