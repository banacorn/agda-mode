"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const lexer_1 = require("./lexer");
// regular expressions
const texBeginRegex = /\\begin\{code\}.*/;
const texEndRegex = /\\end\{code\}.*/;
const markdownRegex = /\`\`\`(agda)?/;
const commentRegex = /(--[^\r\n]*[\r\n])|(\{-(?:[^-]|[\r\n]|(-+(?:[^-\}]|[\r\n])))*-+\})/;
const goalBracketRegex = /(\{\!(?:(?!\!\})(?:.|\s))*\!\})/;
const goalQuestionMarkRawRegex = /([\s\(\{\_\;\.\"@]\?)/;
const goalQuestionMarkRegex = /(\?)/;
const goalBracketContentRegex = /\{\!((?:(?!\!\})(?:.|\s))*)\!\}/;
function isHole(token) {
    return token.type === 5 /* GoalQM */ || token.type === 3 /* GoalBracket */;
}
function lines(text) {
    let cursor = 0;
    return text.match(/(.*(?:\r\n|[\n\v\f\r\x85\u2028\u2029])?)/g)
        .filter(str => str.length > 0)
        .map(str => {
        const cursorOld = cursor;
        cursor += str.length;
        return {
            content: text.substring(cursorOld, cursor),
            range: {
                start: cursorOld,
                end: cursor
            },
            type: 1 /* Literate */
        };
    });
}
function filterOutTex(text) {
    let insideAgda = false;
    return lines(text).map((line) => {
        // flip `insideAgda` to `false` after "end{code}"
        if (texEndRegex.test(line.content)) {
            insideAgda = false;
        }
        line.type = insideAgda ? 0 /* AgdaRaw */ : 1 /* Literate */;
        // flip `insideAgda` to `true` after "begin{code}"
        if (texBeginRegex.test(line.content)) {
            insideAgda = true;
        }
        return line;
    });
}
function filterOutMarkdown(text) {
    let insideAgda = false;
    return lines(text).map((line) => {
        // leaving Agda code
        if (insideAgda && markdownRegex.test(line.content)) {
            insideAgda = false;
        }
        line.type = insideAgda ? 0 /* AgdaRaw */ : 1 /* Literate */;
        // entering Agda code
        if (!insideAgda && markdownRegex.test(line.content)) {
            insideAgda = true;
        }
        return line;
    });
}
function parseHole(text, indices, fileType) {
    // counter for indices
    let i = 0;
    let preprocessed;
    switch (fileType) {
        case 1 /* LiterateTeX */:
            preprocessed = filterOutTex(text);
            break;
        case 3 /* LiterateMarkdown */:
            preprocessed = filterOutMarkdown(text);
            break;
        default:
            preprocessed = text;
    }
    // just lexing, doesn't mess around with raw text, preserves positions
    const original = new lexer_1.default(preprocessed)
        .lex(commentRegex, 0 /* AgdaRaw */, 2 /* Comment */)
        .lex(goalBracketRegex, 0 /* AgdaRaw */, 3 /* GoalBracket */)
        .lex(goalQuestionMarkRawRegex, 0 /* AgdaRaw */, 4 /* GoalQMRaw */)
        .lex(goalQuestionMarkRegex, 4 /* GoalQMRaw */, 5 /* GoalQM */)
        .result;
    const modified = new lexer_1.default(_.cloneDeep(original))
        .mapOnly(5 /* GoalQM */, (token) => {
        //  ? => {!  !}
        token.type = 3 /* GoalBracket */;
        token.content = '{!   !}';
        return token;
    })
        .mapOnly(3 /* GoalBracket */, (token) => {
        // {!!} => {!   !}
        // in case the goalIndex wasn't given, make it '*'
        // this happens when splitting case, agda2-goals-action is one index short
        const goalIndex = indices[i] && indices[i].toString() || '*';
        // {! zero 42!}
        //   <------>    hole content
        //         <>    index
        //        <->    space for index
        // count how much space the index would take
        const requiredSpaces = goalIndex.length;
        // count how much space we have
        const content = goalBracketContentRegex.exec(token.content)[1];
        const actualSpaces = content.match(/\s*$/)[0].length;
        // make room for the index, if there's not enough space
        if (actualSpaces < requiredSpaces) {
            const padding = _.repeat(' ', requiredSpaces - actualSpaces);
            token.content = token.content.replace(/\{!.*!\}/, `{!${content + padding}!}`);
        }
        i = i + 1;
        return token;
    })
        .result;
    const originalHoles = original.filter(isHole);
    const modifiedHoles = modified.filter(isHole);
    return originalHoles.map((token, idx) => {
        const modifiedHole = modifiedHoles[idx];
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