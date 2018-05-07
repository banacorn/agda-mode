import * as _ from 'lodash';
import Lexer from './lexer';
import { Token, TokenType, FileType, Hole } from '../type';

// regular expressions
const texBeginRegex = /\\begin\{code\}.*/;
const texEndRegex = /\\end\{code\}.*/;
const markdownRegex = /\`\`\`(agda)?/;

const commentRegex = /(--[^\r\n]*[\r\n])|(\{-(?:[^-]|[\r\n]|(-+(?:[^-\}]|[\r\n])))*-+\})/;
const goalBracketRegex = /(\{\!(?:(?!\!\})(?:.|\s))*\!\})/
const goalQuestionMarkRawRegex = /([\s\(\{\_\;\.\"@]\?)/
const goalQuestionMarkRegex = /(\?)/
const goalBracketContentRegex = /\{\!((?:(?!\!\})(?:.|\s))*)\!\}/

function isHole(token: Token): boolean {
    return token.type === TokenType.GoalQM || token.type === TokenType.GoalBracket;
}

function parseHole(text: string, indices: number[], fileType: FileType): Hole[] {
    // counter for indices
    let i = 0;

    console.log(fileType === FileType.LiterateTeX);

    // just lexing, doesn't mess around with raw text, preserves positions
    const original = new Lexer(text)
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
