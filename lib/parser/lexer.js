"use strict";
var _ = require("lodash");
var Lexer = (function () {
    function Lexer(raw) {
        if (typeof raw === "string") {
            this.result = [{
                    content: raw,
                    range: {
                        start: 0,
                        end: raw.length
                    },
                    type: 0
                }];
        }
        else {
            this.result = raw;
        }
    }
    Lexer.prototype.lex = function (regex, sourceType, targetType) {
        var temp = this.result.map(function (token) {
            if (token.type === sourceType) {
                var cursor_1 = token.range.start;
                return token.content
                    .split(regex)
                    .filter(function (t) { return t; })
                    .map(function (t, i) {
                    var type = regex.test(t) ? targetType : sourceType;
                    var cursorOld = cursor_1;
                    cursor_1 += t.length;
                    return {
                        content: t,
                        range: {
                            start: cursorOld,
                            end: cursor_1
                        },
                        type: type
                    };
                });
            }
            else {
                return token;
            }
        });
        this.result = [].concat.apply([], temp);
        return this;
    };
    Lexer.prototype.map = function (f) {
        var delta = 0;
        this.result = this.result.map(function (token) {
            var tokenNew = f(_.cloneDeep(token));
            var lengthDiff = tokenNew.content.length - token.content.length;
            token.content = tokenNew.content;
            token.type = tokenNew.type;
            token.range.start += delta;
            delta += lengthDiff;
            token.range.end += delta;
            return token;
        });
        return this;
    };
    Lexer.prototype.mapOnly = function (type, f) {
        this.map(function (token) {
            if (token.type === type)
                return f(token);
            else
                return token;
        });
        return this;
    };
    return Lexer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Lexer;
