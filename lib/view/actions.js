"use strict";
var redux_actions_1 = require('redux-actions');
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    INPUT_METHOD.INSERT = 'INPUT_METHOD.INSERT';
    INPUT_METHOD.DELETE = 'INPUT_METHOD.DELETE';
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
exports.activateInputMethod = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
exports.deactivateInputMethod = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
exports.insertInputMethod = redux_actions_1.createAction(INPUT_METHOD.INSERT);
exports.deleteInputMethod = redux_actions_1.createAction(INPUT_METHOD.DELETE);
//# sourceMappingURL=actions.js.map