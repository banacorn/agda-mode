"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redux_actions_1 = require("redux-actions");
var EVENT;
(function (EVENT) {
    EVENT.JUMP_TO_GOAL = 'EVENT.JUMP_TO_GOAL';
    EVENT.MOUSE_OVER = 'EVENT.MOUSE_OVER';
    EVENT.MOUSE_OUT = 'EVENT.MOUSE_OUT';
    EVENT.JUMP_TO_RANGE = 'EVENT.JUMP_TO_RANGE';
})(EVENT = exports.EVENT || (exports.EVENT = {}));
var VIEW;
(function (VIEW) {
    VIEW.ACTIVATE = 'VIEW.ACTIVATE';
    VIEW.DEACTIVATE = 'VIEW.DEACTIVATE';
    VIEW.MOUNT = 'VIEW.MOUNT';
    VIEW.UNMOUNT = 'VIEW.UNMOUNT';
    VIEW.MOUNT_AT_PANE = 'VIEW.MOUNT_AT_PANE';
    VIEW.MOUNT_AT_BOTTOM = 'VIEW.MOUNT_AT_BOTTOM';
    VIEW.TOGGLE_SETTINGS_VIEW = 'VIEW.TOGGLE_SETTINGS_VIEW';
    VIEW.NAVIGATE = 'VIEW.NAVIGATE';
    VIEW.activate = redux_actions_1.createAction(VIEW.ACTIVATE);
    VIEW.deactivate = redux_actions_1.createAction(VIEW.DEACTIVATE);
    VIEW.mount = redux_actions_1.createAction(VIEW.MOUNT);
    VIEW.unmount = redux_actions_1.createAction(VIEW.UNMOUNT);
    VIEW.mountAtPane = redux_actions_1.createAction(VIEW.MOUNT_AT_PANE);
    VIEW.mountAtBottom = redux_actions_1.createAction(VIEW.MOUNT_AT_BOTTOM);
    VIEW.toggleSettings = redux_actions_1.createAction(VIEW.TOGGLE_SETTINGS_VIEW);
    VIEW.navigate = redux_actions_1.createAction(VIEW.NAVIGATE);
})(VIEW = exports.VIEW || (exports.VIEW = {}));
var MODE;
(function (MODE) {
    MODE.DISPLAY = 'MODE.DISPLAY';
    MODE.QUERY = 'MODE.QUERY';
    MODE.QUERY_CONNECTION = 'MODE.QUERY_CONNECTION';
    MODE.display = redux_actions_1.createAction(MODE.DISPLAY);
    MODE.query = redux_actions_1.createAction(MODE.QUERY);
    MODE.queryConnection = redux_actions_1.createAction(MODE.QUERY_CONNECTION);
})(MODE = exports.MODE || (exports.MODE = {}));
var CONNECTION;
(function (CONNECTION) {
    CONNECTION.CONNECT_AGDA = 'CONNECTION.CONNECT_AGDA_AGDA';
    CONNECTION.DISCONNECT_AGDA = 'CONNECTION.DISCONNECT_AGDA_AGDA';
    CONNECTION.START_QUERYING = 'CONNECTION.START_QUERYING';
    CONNECTION.STOP_QUERYING = 'CONNECTION.STOP_QUERYING';
    CONNECTION.SET_AGDA_MESSAGE = 'CONNECTION.SET_AGDA_MESSAGE';
    CONNECTION.connectAgda = redux_actions_1.createAction(CONNECTION.CONNECT_AGDA);
    CONNECTION.disconnectAgda = redux_actions_1.createAction(CONNECTION.DISCONNECT_AGDA);
    CONNECTION.startQuerying = redux_actions_1.createAction(CONNECTION.START_QUERYING);
    CONNECTION.stopQuerying = redux_actions_1.createAction(CONNECTION.STOP_QUERYING);
    CONNECTION.setAgdaMessage = redux_actions_1.createAction(CONNECTION.SET_AGDA_MESSAGE);
})(CONNECTION = exports.CONNECTION || (exports.CONNECTION = {}));
var PROTOCOL;
(function (PROTOCOL) {
    PROTOCOL.LOG_REQUEST = 'PROTOCOL.LOG_REQUEST';
    PROTOCOL.LOG_RESPONSES = 'PROTOCOL.LOG_RESPONSE';
    PROTOCOL.LIMIT_LOG = 'PROTOCOL.LIMIT_LOG';
    PROTOCOL.PENDING = 'PROTOCOL.PENDING';
    PROTOCOL.logRequest = redux_actions_1.createAction(PROTOCOL.LOG_REQUEST);
    PROTOCOL.logResponses = redux_actions_1.createAction(PROTOCOL.LOG_RESPONSES);
    PROTOCOL.limitLog = redux_actions_1.createAction(PROTOCOL.LIMIT_LOG);
    PROTOCOL.pending = redux_actions_1.createAction(PROTOCOL.PENDING);
})(PROTOCOL = exports.PROTOCOL || (exports.PROTOCOL = {}));
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    INPUT_METHOD.INSERT = 'INPUT_METHOD.INSERT';
    INPUT_METHOD.DELETE = 'INPUT_METHOD.DELETE';
    INPUT_METHOD.REPLACE_SYMBOL = 'INPUT_METHOD.REPLACE_SYMBOL';
    INPUT_METHOD.activate = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
    INPUT_METHOD.deactivate = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
    INPUT_METHOD.insertChar = redux_actions_1.createAction(INPUT_METHOD.INSERT);
    INPUT_METHOD.deleteChar = redux_actions_1.createAction(INPUT_METHOD.DELETE);
    INPUT_METHOD.replaceSymbol = redux_actions_1.createAction(INPUT_METHOD.REPLACE_SYMBOL);
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
var HEADER;
(function (HEADER) {
    HEADER.UPDATE = 'HEADER.UPDATE';
    HEADER.update = redux_actions_1.createAction(HEADER.UPDATE);
})(HEADER = exports.HEADER || (exports.HEADER = {}));
var QUERY;
(function (QUERY) {
    QUERY.SET_PLACEHOLDER = 'QUERY.SET_PLACEHOLDER';
    QUERY.UPDATE_VALUE = 'QUERY.UPDATE_VALUE';
    QUERY.updateValue = redux_actions_1.createAction(QUERY.UPDATE_VALUE);
    QUERY.setPlaceholder = redux_actions_1.createAction(QUERY.SET_PLACEHOLDER);
})(QUERY = exports.QUERY || (exports.QUERY = {}));
var BODY;
(function (BODY) {
    BODY.UPDATE_All_GOALS_WARNINGS = 'BODY.UPDATE_All_GOALS_WARNINGS';
    BODY.UPDATE_EMACS_All_GOALS_WARNINGS = 'BODY.UPDATE_EMACS_All_GOALS_WARNINGS';
    BODY.UPDATE_EMACS_GOAL_TYPE_CONTEXT = 'BODY.UPDATE_EMACS_GOAL_TYPE_CONTEXT';
    BODY.UPDATE_EMACS_CONSTRAINTS = 'BODY.UPDATE_EMACS_CONSTRAINTS';
    BODY.UPDATE_EMACS_SOLUTIONS = 'BODY.UPDATE_EMACS_SOLUTIONS';
    BODY.UPDATE_EMACS_ERROR = 'BODY.UPDATE_EMACS_ERROR';
    BODY.UPDATE_ERROR = 'BODY.UPDATE_ERROR';
    BODY.UPDATE_PLAIN_TEXT = 'BODY.UPDATE_PLAIN_TEXT';
    BODY.UPDATE_MAX_BODY_HEIGHT = 'BODY.UPDATE_MAX_BODY_HEIGHT';
})(BODY = exports.BODY || (exports.BODY = {}));
exports.updateAllGoalsWarnings = redux_actions_1.createAction(BODY.UPDATE_All_GOALS_WARNINGS);
exports.updateEmacsAllGoalsWarnings = redux_actions_1.createAction(BODY.UPDATE_EMACS_All_GOALS_WARNINGS);
exports.updateEmacsGoalTypeContext = redux_actions_1.createAction(BODY.UPDATE_EMACS_GOAL_TYPE_CONTEXT);
exports.updateEmacsConstraints = redux_actions_1.createAction(BODY.UPDATE_EMACS_CONSTRAINTS);
exports.updateEmacsSolutions = redux_actions_1.createAction(BODY.UPDATE_EMACS_SOLUTIONS);
exports.updateEmacsError = redux_actions_1.createAction(BODY.UPDATE_EMACS_ERROR);
exports.updateError = redux_actions_1.createAction(BODY.UPDATE_ERROR);
exports.updatePlainText = redux_actions_1.createAction(BODY.UPDATE_PLAIN_TEXT);
exports.updateMaxBodyHeight = redux_actions_1.createAction(BODY.UPDATE_MAX_BODY_HEIGHT);
//# sourceMappingURL=actions.js.map