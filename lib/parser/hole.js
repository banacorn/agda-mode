"use strict";
var _ = require("lodash");
var lexer_1 = require("./lexer");
// regular expressions
var commentRegex = /(--[^\r\n]*[\r\n])|(\{-(?:[^-]|[\r\n]|(-+(?:[^-\}]|[\r\n])))*-+\})/;
var goalBracketRegex = /(\{\!(?:(?!\!\})(?:.|\s))*\!\})/;
var goalQuestionMarkRawRegex = /([\s\(\{\_\;\.\"@]\?)/;
var goalQuestionMarkRegex = /(\?)/;
var goalBracketContentRegex = /\{\!((?:(?!\!\})(?:.|\s))*)\!\}/;
function isHole(token) {
    return token.type === 4 /* GoalQM */ || token.type === 2 /* GoalBracket */;
}
function parseHole(text, indices) {
    // counter for indices
    var i = 0;
    // just lexing, doesn't mess around with raw text, preserves positions
    var original = new lexer_1.default(text)
        .lex(commentRegex, 0 /* Raw */, 1 /* Comment */)
        .lex(goalBracketRegex, 0 /* Raw */, 2 /* GoalBracket */)
        .lex(goalQuestionMarkRawRegex, 0 /* Raw */, 3 /* GoalQMRaw */)
        .lex(goalQuestionMarkRegex, 3 /* GoalQMRaw */, 4 /* GoalQM */)
        .result;
    var modified = new lexer_1.default(_.cloneDeep(original))
        .mapOnly(4 /* GoalQM */, function (token) {
        //  ? => {!  !}
        token.type = 2 /* GoalBracket */;
        token.content = '{!   !}';
        return token;
    })
        .mapOnly(2 /* GoalBracket */, function (token) {
        // {!!} => {!   !}
        // in case the goalIndex wasn't given, make it '*'
        // this happens when splitting case, agda2-goals-action is one index short
        var goalIndex = indices[i] && indices[i].toString() || '*';
        // {! zero 42!}
        //   <------>    hole content
        //         <>    index
        //        <->    space for index
        // count how much space the index would take
        var requiredSpaces = goalIndex.length;
        // count how much space we have
        var content = goalBracketContentRegex.exec(token.content)[1];
        var actualSpaces = content.match(/\s*$/)[0].length;
        // make room for the index, if there's not enough space
        if (actualSpaces < requiredSpaces) {
            var padding = _.repeat(' ', requiredSpaces - actualSpaces);
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
exports.parseHole = parseHole;
//# sourceMappingURL=hole.js.map