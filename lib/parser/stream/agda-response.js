"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var stream_1 = require('stream');
var _ = require('lodash');
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
        case "*All Goals*": return 0;
        case "*Error*": return 1;
        case "*Type-checking*": return 2;
        case "*Current Goal*": return 3;
        case "*Inferred Type*": return 4;
        case "*Module contents*": return 5;
        case "*Context*": return 6;
        case "*Goal type etc.*": return 7;
        case "*Normal Form*": return 8;
        case "*Intro*": return 9;
        case "*Auto*": return 10;
        case "*Constraints*": return 11;
        case "*Scope Info*": return 12;
    }
}
