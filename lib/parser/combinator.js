"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const P = require("parsimmon");
function beforePrim(f, s) {
    return P.custom((success, failure) => {
        return (stream, i) => {
            const index = stream.substr(i).indexOf(s);
            if (index !== -1 && i <= stream.length) {
                return success(i + index, f(stream.substr(i, index)));
            }
            else {
                return failure(i, `'${s}' not found`);
            }
        };
    });
}
const before = (s) => beforePrim((x) => x, s);
exports.before = before;
const beforeAndSkip = (s) => before(s).skip(P.string(s));
exports.beforeAndSkip = beforeAndSkip;
const trimBefore = (s) => beforePrim((x) => x.trim(), s).skip(spaces);
exports.trimBefore = trimBefore;
const trimBeforeAndSkip = (s) => trimBefore(s).skip(P.string(s)).skip(spaces);
exports.trimBeforeAndSkip = trimBeforeAndSkip;
const spaces = P.regex(/\s*/);
exports.spaces = spaces;
const token = (s) => P.string(s).skip(spaces);
exports.token = token;
//# sourceMappingURL=combinator.js.map