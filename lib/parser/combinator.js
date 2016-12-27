"use strict";
var P = require("parsimmon");
function beforePrim(f, s) {
    return P.custom(function (success, failure) {
        return function (stream, i) {
            var index = stream.substr(i).indexOf(s);
            if (index !== -1 && i <= stream.length) {
                return success(i + index, f(stream.substr(i, index)));
            }
            else {
                return failure(i, "'" + s + "' not found");
            }
        };
    });
}
var before = function (s) { return beforePrim(function (x) { return x; }, s); };
exports.before = before;
var beforeAndSkip = function (s) { return before(s).skip(P.string(s)); };
exports.beforeAndSkip = beforeAndSkip;
var trimBefore = function (s) { return beforePrim(function (x) { return x.trim(); }, s).skip(spaces); };
exports.trimBefore = trimBefore;
var trimBeforeAndSkip = function (s) { return trimBefore(s).skip(P.string(s)).skip(spaces); };
exports.trimBeforeAndSkip = trimBeforeAndSkip;
var spaces = P.regex(/\s*/);
exports.spaces = spaces;
var token = function (s) { return P.string(s).skip(spaces); };
exports.token = token;
//# sourceMappingURL=combinator.js.map