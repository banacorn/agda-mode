"use strict";
var redux_actions_1 = require('redux-actions');
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    INPUT_METHOD.SUGGEST_KEYS = 'INPUT_METHOD.SUGGEST_KEYS';
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
exports.activateInputMethod = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
exports.deactivateInputMethod = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
exports.suggestKeys = redux_actions_1.createAction(INPUT_METHOD.SUGGEST_KEYS);
//# sourceMappingURL=actions.js.map