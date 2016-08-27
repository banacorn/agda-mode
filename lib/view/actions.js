"use strict";
var redux_actions_1 = require('redux-actions');
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
exports.activateInputMethod = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
exports.deactivateInputMethod = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
//# sourceMappingURL=actions.js.map