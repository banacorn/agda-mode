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
                kind: "InfoAction",
                infoActionKind: type,
                content: content
            };
        case "agda2-status-action":
            return {
                kind: "StatusAction",
                content: tokens.slice(1, 2)
            };
        case "agda2-goals-action":
            return {
                kind: "GoalsAction",
                content: tokens[1].map(function (s) { return parseInt(s); })
            };
        case "agda2-give-action":
            var index = parseInt(tokens[1]);
            // with parenthesis: ["agda2-give-action", 1, "'paren"]
            // w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
            // with content    : ["agda2-give-action", 0, ...]
            switch (tokens[2]) {
                case "'paren": return {
                    kind: "GiveAction",
                    index: index,
                    content: "",
                    hasParenthesis: true
                };
                case "'no-paren": return {
                    kind: "GiveAction",
                    index: index,
                    content: "",
                    hasParenthesis: false
                };
                default: return {
                    kind: "GiveAction",
                    index: index,
                    content: tokens[2],
                    hasParenthesis: false
                };
            }
        case "agda2-parse-error":
            return {
                kind: "ParseError",
                content: tokens.slice(1)
            };
        case "agda2-goto":
        case "agda2-maybe-goto":
            return {
                kind: "Goto",
                filepath: tokens[1][0],
                position: parseInt(tokens[1][2])
            };
        case "agda2-solveAll-action":
            return {
                kind: "SolveAllAction",
                solutions: _.chunk(tokens[1], 2).map(function (arr) {
                    return { index: arr[0], expression: arr[1] };
                })
            };
        case "agda2-make-case-action":
            return {
                kind: "MakeCaseAction",
                content: tokens[1]
            };
        case "agda2-make-case-action-extendlam":
            return {
                kind: "MakeCaseActionExtendLam",
                content: tokens[1]
            };
        case "agda2-highlight-clear":
            return {
                kind: "HighlightClear",
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
                kind: "HighlightAddAnnotations",
                content: annotations
            };
        case "agda2-highlight-load-and-delete-action":
            return {
                kind: "HighlightLoadAndDeleteAction",
                content: tokens[1]
            };
        default:
            return {
                kind: "UnknownAction",
                content: tokens
            };
    }
}
exports.parseAgdaResponse = parseAgdaResponse;
function parseInfoActionType(s) {
    switch (s) {
        case "*All Goals*": return "AllGoals";
        case "*Error*": return "Error";
        case "*Type-checking*": return "TypeChecking";
        case "*Current Goal*": return "CurrentGoal";
        case "*Inferred Type*": return "InferredType";
        case "*Module contents*": return "ModuleContents";
        case "*Context*": return "Context";
        case "*Goal type etc.*": return "GoalTypeEtc";
        case "*Normal Form*": return "NormalForm";
        case "*Intro*": return "Intro";
        case "*Auto*": return "Auto";
        case "*Constraints*": return "Constraints";
        case "*Scope Info*": return "ScopeInfo";
        default: return "Unknown";
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
