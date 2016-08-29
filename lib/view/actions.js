"use strict";
var redux_actions_1 = require('redux-actions');
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    INPUT_METHOD.INSERT = 'INPUT_METHOD.INSERT';
    INPUT_METHOD.DELETE = 'INPUT_METHOD.DELETE';
    INPUT_METHOD.REPLACE_SYMBOL = 'INPUT_METHOD.REPLACE_SYMBOL';
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
exports.activateInputMethod = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
exports.deactivateInputMethod = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
exports.insertInputMethod = redux_actions_1.createAction(INPUT_METHOD.INSERT);
exports.deleteInputMethod = redux_actions_1.createAction(INPUT_METHOD.DELETE);
exports.replaceSymbol = redux_actions_1.createAction(INPUT_METHOD.REPLACE_SYMBOL);
var HEADER;
(function (HEADER) {
    HEADER.UPDATE = 'HEADER.UPDATE';
})(HEADER = exports.HEADER || (exports.HEADER = {}));
exports.updateHeader = redux_actions_1.createAction(HEADER.UPDATE);
var INPUT_EDITOR;
(function (INPUT_EDITOR) {
    INPUT_EDITOR.ACTIVATE = 'INPUT_EDITOR.ACTIVATE';
    INPUT_EDITOR.DEACTIVATE = 'INPUT_EDITOR.DEACTIVATE';
})(INPUT_EDITOR = exports.INPUT_EDITOR || (exports.INPUT_EDITOR = {}));
exports.activateInputEditor = redux_actions_1.createAction(INPUT_EDITOR.ACTIVATE);
exports.deactivateInputEditor = redux_actions_1.createAction(INPUT_EDITOR.DEACTIVATE);
//# sourceMappingURL=actions.js.map