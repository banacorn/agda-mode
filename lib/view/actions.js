"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_actions_1 = require("redux-actions");
var EVENT;
(function (EVENT) {
    EVENT.JUMP_TO_GOAL = 'EVENT.JUMP_TO_GOAL';
    EVENT.JUMP_TO_LOCATION = 'EVENT.JUMP_TO_LOCATION';
})(EVENT = exports.EVENT || (exports.EVENT = {}));
var VIEW;
(function (VIEW) {
    VIEW.ACTIVATE = 'VIEW.ACTIVATE';
    VIEW.DEACTIVATE = 'VIEW.DEACTIVATE';
    VIEW.MOUNT = 'VIEW.MOUNT';
    VIEW.UNMOUNT = 'VIEW.UNMOUNT';
    VIEW.MOUNT_AT_PANE = 'VIEW.MOUNT_AT_PANE';
    VIEW.MOUNT_AT_BOTTOM = 'VIEW.MOUNT_AT_BOTTOM';
    VIEW.TOGGLE_DEV_VIEW = 'VIEW.TOGGLE_DEV_VIEW';
})(VIEW = exports.VIEW || (exports.VIEW = {}));
exports.activateView = redux_actions_1.createAction(VIEW.ACTIVATE);
exports.deactivateView = redux_actions_1.createAction(VIEW.DEACTIVATE);
exports.mountView = redux_actions_1.createAction(VIEW.MOUNT);
exports.unmountView = redux_actions_1.createAction(VIEW.UNMOUNT);
exports.mountAtPane = redux_actions_1.createAction(VIEW.MOUNT_AT_PANE);
exports.mountAtBottom = redux_actions_1.createAction(VIEW.MOUNT_AT_BOTTOM);
exports.toggleDevView = redux_actions_1.createAction(VIEW.TOGGLE_DEV_VIEW);
var DEV;
(function (DEV) {
    DEV.ADD_REQUEST = 'DEV.ADD_REQUEST';
    DEV.ADD_RESPONSE = 'DEV.ADD_RESPONSE';
    DEV.CLEAR_ALL = 'DEV.CLEAR_ALL';
    DEV.TOGGLE_ACCUMULATE = 'DEV.TOGGLE_ACCUMULATE';
    DEV.TOGGLE_LSP = 'DEV.TOGGLE_LSP';
})(DEV = exports.DEV || (exports.DEV = {}));
exports.devAddRequest = redux_actions_1.createAction(DEV.ADD_REQUEST);
exports.devAddResponse = redux_actions_1.createAction(DEV.ADD_RESPONSE);
exports.devClearAll = redux_actions_1.createAction(DEV.CLEAR_ALL);
exports.devToggleAccumulate = redux_actions_1.createAction(DEV.TOGGLE_ACCUMULATE);
exports.devToggleLSP = redux_actions_1.createAction(DEV.TOGGLE_LSP);
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    INPUT_METHOD.INSERT = 'INPUT_METHOD.INSERT';
    INPUT_METHOD.DELETE = 'INPUT_METHOD.DELETE';
    INPUT_METHOD.REPLACE_SYMBOL = 'INPUT_METHOD.REPLACE_SYMBOL';
    INPUT_METHOD.ENABLE_IN_MINI_EDITOR = 'INPUT_METHOD.ENABLE_IN_MINI_EDITOR';
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
exports.activateInputMethod = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
exports.deactivateInputMethod = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
exports.insertInputMethod = redux_actions_1.createAction(INPUT_METHOD.INSERT);
exports.deleteInputMethod = redux_actions_1.createAction(INPUT_METHOD.DELETE);
exports.replaceSymbol = redux_actions_1.createAction(INPUT_METHOD.REPLACE_SYMBOL);
exports.enableInMiniEditor = redux_actions_1.createAction(INPUT_METHOD.ENABLE_IN_MINI_EDITOR);
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
    BODY.UPDATE_MAX_BODY_HEIGHT = 'BODY.UPDATE_MAX_BODY_HEIGHT';
})(BODY = exports.BODY || (exports.BODY = {}));
exports.updateBanner = redux_actions_1.createAction(BODY.UPDATE_BANNER);
exports.updateBody = redux_actions_1.createAction(BODY.UPDATE_BODY);
exports.updateError = redux_actions_1.createAction(BODY.UPDATE_ERROR);
exports.updatePlainText = redux_actions_1.createAction(BODY.UPDATE_PLAIN_TEXT);
exports.updateMaxBodyHeight = redux_actions_1.createAction(BODY.UPDATE_MAX_BODY_HEIGHT);
//# sourceMappingURL=actions.js.map