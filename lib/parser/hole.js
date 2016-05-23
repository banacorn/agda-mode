"use strict";
var _ = require("lodash");
var lexer_1 = require("./lexer");
var commentRegex = /(--[^\r\n]*[\r\n])|(\{-(?:[^-]|[\r\n]|(-+(?:[^-\}]|[\r\n])))*-+\})/;
var goalBracketRegex = /(\{\!(?:(?!\!\})(?:.|\s))*\!\})/;
var goalQuestionMarkRawRegex = /([\s\(\{\_\;\.\"@]\?)/;
var goalQuestionMarkRegex = /(\?)/;
var goalBracketContentRegex = /\{\!((?:(?!\!\})(?:.|\s))*)\!\}/;
function isHole(token) {
    return token.type === 4 || token.type === 2;
}
function parseHole(text, indices) {
    var i = 0;
    var original = new lexer_1.default(text)
        .lex(commentRegex, 0, 1)
        .lex(goalBracketRegex, 0, 2)
        .lex(goalQuestionMarkRawRegex, 0, 3)
        .lex(goalQuestionMarkRegex, 3, 4)
        .result;
    var modified = new lexer_1.default(_.cloneDeep(original))
        .mapOnly(4, function (token) {
        token.type = 2;
        token.content = "{!   !}";
        return token;
    })
        .mapOnly(2, function (token) {
        var goalIndex = indices[i].toString() || "*";
        var requiredSpaces = goalIndex.length;
        var content = goalBracketContentRegex.exec(token.content)[1];
        var actualSpaces = content.match(/\s*$/)[0].length;
        if (actualSpaces < requiredSpaces) {
            var padding = _.repeat(" ", requiredSpaces - actualSpaces);
            token.content = token.content.replace(/\{!.*!\}/, "{!" + (content + padding) + "!}");
        }
        i = i + 1;
        return token;
    })
        .result;
    var originalHoles = original.filter(isHole);
    var modifiedHoles = modified.filter(isHole);
    return originalHoles.map(function (token, idx) {
        var modifiedHole = modifiedHoles[idx];
        return {
            index: indices[idx],
            originalRange: {
                start: modifiedHole.range.start,
                end: modifiedHole.range.start + token.content.length
            },
            modifiedRange: modifiedHole.range,
            content: modifiedHole.content
        };
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = parseHole;
