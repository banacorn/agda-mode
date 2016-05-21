"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
var _ = require('lodash');
var types_1 = require('../../types');
var ParseAgdaResponse = (function (_super) {
    __extends(ParseAgdaResponse, _super);
    function ParseAgdaResponse() {
        _super.call(this, { objectMode: true });
    }
    ParseAgdaResponse.prototype._transform = function (tokens, encoding, next) {
        this.push(parseAgdaResponse(tokens));
        next();
    };
    return ParseAgdaResponse;
}(stream_1.Transform));
exports.ParseAgdaResponse = ParseAgdaResponse;
function parseAgdaResponse(tokens) {
    switch (tokens[0]) {
        case "agda2-info-action":
            var type = parseInfoActionType(tokens[1]);
            var content = tokens.length === 3 ? [] : _.compact(tokens[2].split("\\n"));
            return {
                type: type,
                content: content
            };
        case "agda2-status-action":
            return {
                content: tokens.slice(1, 2)
            };
        case "agda2-goals-action":
            return {
                content: tokens.slice(1, 2)
            };
        case "agda2-give-action":
            var index = parseInt(tokens[1]);
            switch (tokens[2]) {
                case "'paren": return {
                    index: index,
                    content: [],
                    hasParenthesis: true
                };
                case "'no-paren": return {
                    index: index,
                    content: [],
                    hasParenthesis: false
                };
                default: return {
                    index: index,
                    content: tokens.slice(2),
                    hasParenthesis: false
                };
            }
        case "agda2-parse-error":
            return {
                content: tokens.slice(1)
            };
        case "agda2-goto":
        case "agda2-maybe-goto":
            return {
                filepath: tokens[1][0],
                position: tokens[1][2]
            };
        case "agda2-solveAll-action":
            return {
                solution: _.chunk(tokens[1], 2)
            };
        case "agda2-make-case-action":
            return {
                content: tokens[1]
            };
        case "agda2-make-case-action-extendlam":
            return {
                content: tokens[1]
            };
        case "agda2-highlight-clear":
            return {
                content: tokens
            };
        case "agda2-highlight-add-annotations":
            return {
                content: tokens
            };
        case "agda2-highlight-load-and-delete-action":
            return {
                content: tokens[1]
            };
        default:
            return {
                content: tokens
            };
    }
}
function parseInfoActionType(s) {
    switch (s) {
        case "*All Goals*": return types_1.InfoActionType.AllGoals;
        case "*Error*": return types_1.InfoActionType.Error;
        case "*Type-checking*": return types_1.InfoActionType.TypeChecking;
        case "*Current Goal*": return types_1.InfoActionType.CurrentGoal;
        case "*Inferred Type*": return types_1.InfoActionType.InferredType;
        case "*Module contents*": return types_1.InfoActionType.ModuleContents;
        case "*Context*": return types_1.InfoActionType.Context;
        case "*Goal type etc.*": return types_1.InfoActionType.GoalTypeEtc;
        case "*Normal Form*": return types_1.InfoActionType.NormalForm;
        case "*Intro*": return types_1.InfoActionType.Intro;
        case "*Auto*": return types_1.InfoActionType.Auto;
        case "*Constraints*": return types_1.InfoActionType.Constraints;
        case "*Scope Info*": return types_1.InfoActionType.ScopeInfo;
    }
}
