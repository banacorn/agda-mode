"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
var hole_1 = require('./parser/hole');
exports.parseHole = hole_1.default;
__export(require('./parser/agda'));
__export(require('./parser/text'));
