import * as _ from 'lodash';
import Lexer from './lexer';
import { Token, TokenType, FileType, Hole } from '../../type';

// regular expressions
const texBeginRegex = /\\begin\{code\}.*/;
const texEndRegex = /\\end\{code\}.*/;
const markdownRegex = /\`\`\`(agda)?/;

const commentRegex = /(--[^\r\n]*[\r\n])|(\{-(?:[^-]|[\r\n]|(?:-+(?:[^-\}]|[\r\n])))*-+\})/;
const goalBracketRegex = /(\{\!(?:(?!\!\})(?:.|\s))*\!\})/
const goalQuestionMarkRawRegex = /([\s\(\{\_\;\.\"@]\?)/
const goalQuestionMarkRegex = /(\?)/
const goalBracketContentRegex = /\{\!((?:(?!\!\})(?:.|\s))*)\!\}/

function isHole(token: Token): boolean {
    return token.type === TokenType.GoalQM || token.type === TokenType.GoalBracket;
}

function lines(text: string): Token[] {
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
                type: TokenType.Literate
            };
        });
}

function filterOutTex(text: string): Token[] {
    let insideAgda = false;

    return lines(text).map((line) => {
        // flip `insideAgda` to `false` after "end{code}"
        if (texEndRegex.test(line.content)) {
            insideAgda = false;
        }

        line.type = insideAgda ? TokenType.AgdaRaw : TokenType.Literate;

        // flip `insideAgda` to `true` after "begin{code}"
        if (texBeginRegex.test(line.content)) {
            insideAgda = true;
        }

        return line;
    })
}
function filterOutMarkdown(text: string): Token[] {
    let insideAgda = false;

    return lines(text).map((line) => {
        // leaving Agda code
        if (insideAgda && markdownRegex.test(line.content)) {
            insideAgda = false;
        }

        line.type = insideAgda ? TokenType.AgdaRaw : TokenType.Literate;

        // entering Agda code
        if (!insideAgda && markdownRegex.test(line.content)) {
            insideAgda = true;
        }
        return line;
    })
}
function parseHole(text: string, indices: number[], fileType: FileType): Hole[] {
    // counter for indices
    let i = 0;

    let preprocessed: string | Token[];
    switch (fileType) {
        case FileType.LiterateTeX:
            preprocessed = filterOutTex(text);
            break;
        case FileType.LiterateMarkdown:
            preprocessed = filterOutMarkdown(text);
            break;
        default:
            preprocessed = text;
    }

    // just lexing, doesn't mess around with raw text, preserves positions
    const original = new Lexer(preprocessed)
        .lex(commentRegex, TokenType.AgdaRaw, TokenType.Comment)
        .lex(goalBracketRegex, TokenType.AgdaRaw, TokenType.GoalBracket)
        .lex(goalQuestionMarkRawRegex, TokenType.AgdaRaw, TokenType.GoalQMRaw)
        .lex(goalQuestionMarkRegex, TokenType.GoalQMRaw, TokenType.GoalQM)
        .result;
    const modified = new Lexer(_.cloneDeep(original))
        .mapOnly(TokenType.GoalQM, (token) => {
            //  ? => {!  !}
            token.type = TokenType.GoalBracket;
            token.content = '{!   !}';
            return token;
        })
        .mapOnly(TokenType.GoalBracket, (token) => {
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

export {
    parseHole
}
