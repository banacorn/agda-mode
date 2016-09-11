import * as P from 'parsimmon';


function beforePrim(f: (string) => string, s: string) {
    return P.custom((success, failure) => {
        return (stream, i) => {
            const index = stream.substr(i).indexOf(s);
            if (index !== -1 && i <= stream.length) {
                return success(i + index, f(stream.substr(i, index)));
            } else {
                return failure(i, `'${s}' not found`);
            }
        }
    });
}

const before = (s: string) => beforePrim((x) => x, s);
const beforeAndSkip = (s: string) => before(s).skip(P.string(s));
const trimBefore = (s: string) => beforePrim((x) => x.trim(), s).skip(spaces);
const trimBeforeAndSkip = (s: string) => trimBefore(s).skip(P.string(s)).skip(spaces);
const spaces = P.regex(/\s*/);
const token = (s: string) => P.string(s).skip(spaces);

export {
    before, beforeAndSkip,
    trimBefore, trimBeforeAndSkip,
    spaces, token
}
