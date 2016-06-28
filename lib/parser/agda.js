"use strict";
var _ = require("lodash");
var lispToArray = require("lisp-to-array");
function parseAgdaResponse(raw) {
    var tokens = parseSExpression(raw);
    switch (tokens[0]) {
        case "agda2-info-action":
            var type = parseInfoActionType(tokens[1]);
            var content = tokens.length === 3 ? [] : _.compact(tokens[2].split("\\n"));
            return {
                type: 0 /* InfoAction */,
                infoActionType: type,
                content: content
            };
        case "agda2-status-action":
            return {
                type: 1 /* StatusAction */,
                content: tokens.slice(1, 2)
            };
        case "agda2-goals-action":
            return {
                type: 2 /* GoalsAction */,
                content: tokens[1].map(function (s) { return parseInt(s); })
            };
        case "agda2-give-action":
            var index = parseInt(tokens[1]);
            // with parenthesis: ["agda2-give-action", 1, "'paren"]
            // w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
            // with content    : ["agda2-give-action", 0, ...]
            switch (tokens[2]) {
                case "'paren": return {
                    type: 3 /* GiveAction */,
                    index: index,
                    content: "",
                    hasParenthesis: true
                };
                case "'no-paren": return {
                    type: 3 /* GiveAction */,
                    index: index,
                    content: "",
                    hasParenthesis: false
                };
                default: return {
                    type: 3 /* GiveAction */,
                    index: index,
                    content: tokens[2],
                    hasParenthesis: false
                };
            }
        case "agda2-parse-error":
            return {
                type: 4 /* ParseError */,
                content: tokens.slice(1)
            };
        case "agda2-goto":
        case "agda2-maybe-goto":
            return {
                type: 5 /* Goto */,
                filepath: tokens[1][0],
                position: parseInt(tokens[1][2])
            };
        case "agda2-solveAll-action":
            return {
                type: 6 /* SolveAllAction */,
                solutions: _.chunk(tokens[1], 2).map(function (arr) {
                    return { index: arr[0], expression: arr[1] };
                })
            };
        case "agda2-make-case-action":
            return {
                type: 7 /* MakeCaseAction */,
                content: tokens[1]
            };
        case "agda2-make-case-action-extendlam":
            return {
                type: 8 /* MakeCaseActionExtendLam */,
                content: tokens[1]
            };
        case "agda2-highlight-clear":
            return {
                type: 9 /* HighlightClear */,
            };
        case "agda2-highlight-add-annotations":
            var annotations = _
                .tail(tokens)
                .map(function (obj) {
                if (obj[4]) {
                    return {
                        start: obj[0],
                        end: obj[1],
                        type: obj[2],
                        sourse: {
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
            });
            return {
                type: 10 /* HighlightAddAnnotations */,
                content: annotations
            };
        case "agda2-highlight-load-and-delete-action":
            return {
                type: 11 /* HighlightLoadAndDeleteAction */,
                content: tokens[1]
            };
        default:
            return {
                type: 12 /* UnknownAction */,
                content: tokens
            };
    }
}
exports.parseAgdaResponse = parseAgdaResponse;
function parseInfoActionType(s) {
    switch (s) {
        case "*All Goals*": return 0 /* AllGoals */;
        case "*Error*": return 1 /* Error */;
        case "*Type-checking*": return 2 /* TypeChecking */;
        case "*Current Goal*": return 3 /* CurrentGoal */;
        case "*Inferred Type*": return 4 /* InferredType */;
        case "*Module contents*": return 5 /* ModuleContents */;
        case "*Context*": return 6 /* Context */;
        case "*Goal type etc.*": return 7 /* GoalTypeEtc */;
        case "*Normal Form*": return 8 /* NormalForm */;
        case "*Intro*": return 9 /* Intro */;
        case "*Auto*": return 10 /* Auto */;
        case "*Constraints*": return 11 /* Constraints */;
        case "*Scope Info*": return 12 /* ScopeInfo */;
    }
}
////////////////////////////////////////////////////////////////////////////////
//  Parsing S-Expressions
////////////////////////////////////////////////////////////////////////////////
function parseSExpression(s) {
    return postprocess(lispToArray(preprocess(s)));
}
function preprocess(chunk) {
    // polyfill String::startsWith
    if (chunk.substr(0, 6) === "((last") {
        // drop wierd prefix like ((last . 1))
        var index = chunk.indexOf("(agda");
        var length_1 = chunk.length;
        chunk = chunk.substring(index, length_1 - 1);
    }
    if (chunk.substr(0, 13) === "cannot read: ") {
        // handles Agda parse error
        chunk = chunk.substring(12);
        chunk = "(agda2-parse-error" + chunk + ")";
    }
    // make it friendly to 'lisp-to-array' package
    chunk = chunk.replace(/'\(/g, '(__number__ ');
    chunk = chunk.replace(/\("/g, '(__string__ "');
    chunk = chunk.replace(/\(\)/g, '(__nil__)');
    return chunk;
}
// recursive cosmetic surgery
function postprocess(node) {
    if (node instanceof Array) {
        switch (node[0]) {
            case "`":
                return postprocess(node[1]);
            case "__number__": // ["__number__", 1, 2, 3] => [1, 2, 3]
            case "__string__": // ["__string__", 1, 2, 3] => [1, 2, 3]
            case "__nil__":
                node.shift();
                return postprocess(node);
            default:
                return node.map(function (x) { return postprocess(x); });
        }
    }
    else {
        if (typeof node === "string") {
            // some ()s in strings were replaced with (__nil__) when preprocessing
            return node.replace("(__nil__)", "()");
        }
        else {
            return node;
        }
    }
}