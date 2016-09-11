import * as _ from 'lodash';
import { Token, TokenType } from '../types';

// Splits big chunks of raw text into tokens
export default class Lexer {
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
                type: TokenType.Raw
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
                    .map((t, i) => {
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
