"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
;
const view_1 = require("./../emacs/view");
// Goals, warnings, and errors
function parseGWE(goals, warnings, errors) {
    const grouped = _.groupBy(view_1.concatItems(goals.split('\n')).map(view_1.parseExpression), 'judgementForm');
    return {
        goalAndHave: [],
        goals: (grouped['goal'] || []),
        judgements: (grouped['type judgement'] || []),
        terms: (grouped['term'] || []),
        metas: (grouped['meta'] || []),
        sorts: (grouped['sort'] || []),
        warnings: _.compact(warnings.split('\n')),
        errors: _.compact(errors.split('\n'))
    };
}
exports.parseGWE = parseGWE;
//# sourceMappingURL=info.js.map