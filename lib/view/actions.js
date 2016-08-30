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
var MINI_EDITOR;
(function (MINI_EDITOR) {
    MINI_EDITOR.ACTIVATE = 'MINI_EDITOR.ACTIVATE';
    MINI_EDITOR.DEACTIVATE = 'MINI_EDITOR.DEACTIVATE';
})(MINI_EDITOR = exports.MINI_EDITOR || (exports.MINI_EDITOR = {}));
exports.activateMiniEditor = redux_actions_1.createAction(MINI_EDITOR.ACTIVATE);
exports.deactivateMiniEditor = redux_actions_1.createAction(MINI_EDITOR.DEACTIVATE);
var BODY;
(function (BODY) {
    BODY.UPDATE_BANNER = 'BODY.UPDATE_BANNER';
    BODY.UPDATE_BODY = 'BODY.UPDATE_BODY';
    BODY.UPDATE_ERROR = 'BODY.UPDATE_ERROR';
    BODY.UPDATE_PLAIN_TEXT = 'BODY.UPDATE_PLAIN_TEXT';
})(BODY = exports.BODY || (exports.BODY = {}));
exports.updateBanner = redux_actions_1.createAction(BODY.UPDATE_BANNER);
exports.updateBody = redux_actions_1.createAction(BODY.UPDATE_BODY);
exports.updateError = redux_actions_1.createAction(BODY.UPDATE_ERROR);
exports.updatePlainText = redux_actions_1.createAction(BODY.UPDATE_PLAIN_TEXT);
//# sourceMappingURL=actions.js.map