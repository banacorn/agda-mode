import * as _ from 'lodash';
import { FileType } from '../type/agda';

interface IndexRange {
    start: number,
    end: number
}

interface Token {
    content: string,
    range: IndexRange,
    type: TokenType
}

const enum TokenType {
    AgdaRaw,
    Literate,
    Comment,
    GoalBracket,
    GoalQMRaw, // ? + ?
    GoalQM // ?
}

interface Hole {
    index: number,
    modifiedRange: IndexRange,
    originalRange: IndexRange,
    content: string
}


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


// Splits big chunks of raw text into tokens
class Lexer {
    result: Token[]

    // act as the 'return' in a Monad
    constructor(raw: string | Token[]) {
        if (typeof raw === 'string') {
            this.result = [{
                content: raw,
                range: {
                    start: 0,
                    end: raw.length
                },
                type: TokenType.AgdaRaw
            }];
        } else {
            this.result = raw
        }
    }


    // break tokens down into smaller pieces
    //
    // regex     : regex to perform split on a token
    // sourceType: the type of token to look for and perform splitting
    // targetType: the type of token given to the splitted tokens when identified
    lex(regex: RegExp, sourceType: TokenType, targetType: TokenType): Lexer {
        const temp = this.result.map((token) => {
            if (token.type === sourceType) {
                let cursor = token.range.start // tracing ranges
                return token.content
                    .split(regex)
                    .filter((t) => { return t !== undefined && t !== null; })
                    .map((t) => {
                        const type = regex.test(t) ? targetType : sourceType;
                        const cursorOld = cursor;
                        cursor += t.length;
                        return {
                            content: t,
                            range: {
                                start: cursorOld,
                                end: cursor
                            },
                            type: type
                        }
                    });
            } else {
                return token;
            }
        });

        this.result = [].concat.apply([], temp) // concat : [[a]] -> [a]
        return this;
    }

    // map tokens with given function
    map(f: (Token) => Token): Lexer {
        let delta = 0;
        this.result = this.result.map((token) => {
            const tokenNew = f(_.cloneDeep(token));
            const lengthDiff = tokenNew.content.length - token.content.length;
            token.content = tokenNew.content
            token.type = tokenNew.type
            token.range.start += delta
            delta += lengthDiff
            token.range.end += delta
            return token;
        });
        return this;
    }

    // map tokens of certain type
    mapOnly(type: TokenType, f: (Token) => Token): Lexer {
        this.map((token) => {
            if (token.type === type)
                return f(token);
            else
                return token;
        })
        return this;
    }
}
