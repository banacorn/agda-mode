"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
// Splits big chunks of raw text into tokens
class Lexer {
    // act as the 'return' in a Monad
    constructor(raw) {
        if (typeof raw === 'string') {
            this.result = [{
                    content: raw,
                    range: {
                        start: 0,
                        end: raw.length
                    },
                    type: 0 /* Raw */
                }];
        }
        else {
            this.result = raw;
        }
    }
    // break tokens down into smaller pieces
    //
    // regex     : regex to perform split on a token
    // sourceType: the type of token to look for and perform splitting
    // targetType: the type of token given to the splitted tokens when identified
    lex(regex, sourceType, targetType) {
        const temp = this.result.map((token) => {
            if (token.type === sourceType) {
                let cursor = token.range.start; // tracing ranges
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
                    };
                });
            }
            else {
                return token;
            }
        });
        this.result = [].concat.apply([], temp); // concat : [[a]] -> [a]
        return this;
    }
    // map tokens with given function
    map(f) {
        let delta = 0;
        this.result = this.result.map((token) => {
            const tokenNew = f(_.cloneDeep(token));
            const lengthDiff = tokenNew.content.length - token.content.length;
            token.content = tokenNew.content;
            token.type = tokenNew.type;
            token.range.start += delta;
            delta += lengthDiff;
            token.range.end += delta;
            return token;
        });
        return this;
    }
    // map tokens of certain type
    mapOnly(type, f) {
        this.map((token) => {
            if (token.type === type)
                return f(token);
            else
                return token;
        });
        return this;
    }
}
exports.default = Lexer;
//# sourceMappingURL=lexer.js.map