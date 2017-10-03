"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const redux_actions_1 = require("redux-actions");
const Store = require("../persist");
// export type EVENT =
//     EVENT.JUMP_TO_GOAL |
//     EVENT.JUMP_TO_LOCATION |
//     EVENT.FILL_IN_SOLUTION;
var EVENT;
(function (EVENT) {
    EVENT.JUMP_TO_GOAL = 'EVENT.JUMP_TO_GOAL';
    EVENT.JUMP_TO_LOCATION = 'EVENT.JUMP_TO_LOCATION';
    EVENT.FILL_IN_SIMPLE_SOLUTION = 'EVENT.FILL_IN_SIMPLE_SOLUTION';
    EVENT.FILL_IN_INDEXED_SOLUTIONS = 'EVENT.FILL_IN_INDEXED_SOLUTIONS';
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
    VIEW.activate = redux_actions_1.createAction(VIEW.ACTIVATE);
    VIEW.deactivate = redux_actions_1.createAction(VIEW.DEACTIVATE);
    VIEW.mount = redux_actions_1.createAction(VIEW.MOUNT);
    VIEW.unmount = redux_actions_1.createAction(VIEW.UNMOUNT);
    VIEW.mountAtPane = redux_actions_1.createAction(VIEW.MOUNT_AT_PANE);
    VIEW.mountAtBottom = redux_actions_1.createAction(VIEW.MOUNT_AT_BOTTOM);
    VIEW.toggleSettings = redux_actions_1.createAction(VIEW.TOGGLE_SETTINGS_VIEW);
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
    CONNECTION.ADD_CONNECTION = 'CONNECTION.ADD_CONNECTION';
    CONNECTION.REMOVE_CONNECTION = 'CONNECTION.REMOVE_CONNECTION';
    CONNECTION.SELECT_CONNECTION = 'CONNECTION.SELECT_CONNECTION';
    CONNECTION.CONNECT = 'CONNECTION.CONNECT';
    CONNECTION.DISCONNECT = 'CONNECTION.DISCONNECT';
    CONNECTION.ERR = 'CONNECTION.ERR';
    CONNECTION.SHOW_NEW_CONNECTION_VIEW = 'CONNECTION.SHOW_NEW_CONNECTION_VIEW';
    const addConnectionPure = redux_actions_1.createAction(CONNECTION.ADD_CONNECTION);
    CONNECTION.addConnection = (connInfo) => dispatch => {
        // update the internal state
        Store.update(state => {
            const exists = _.find(state.connections, {
                guid: connInfo.guid
            });
            if (!exists) {
                state.connections.push(connInfo);
                // dispatch action
                dispatch(addConnectionPure(connInfo));
            }
            return state;
        });
    };
    const removeConnectionPure = redux_actions_1.createAction(CONNECTION.REMOVE_CONNECTION);
    CONNECTION.removeConnection = (guid) => dispatch => {
        // update the internal state
        Store.update(state => {
            _.remove(state.connections, (conn) => conn['guid'] === guid);
            if (state.connected && state.connected === guid)
                state.connected = undefined;
            if (state.selected && state.selected === guid)
                state.selected = undefined;
            _.remove(state.erred, id => id === guid);
            return state;
        });
        // dispatch action
        dispatch(removeConnectionPure(guid));
    };
    const selectConnectionPure = redux_actions_1.createAction(CONNECTION.SELECT_CONNECTION);
    CONNECTION.selectConnection = (guid) => dispatch => {
        // update the internal state
        Store.update(state => {
            state.selected = guid;
            return state;
        });
        // dispatch action
        dispatch(selectConnectionPure(guid));
    };
    const connectPure = redux_actions_1.createAction(CONNECTION.CONNECT);
    CONNECTION.connect = (guid) => dispatch => {
        // update the internal state and erase previously erred attempts
        Store.update(state => {
            state.connected = guid;
            _.remove(state.erred, id => id === guid);
            return state;
        });
        // dispatch action
        dispatch(connectPure(guid));
    };
    const disconnectPure = redux_actions_1.createAction(CONNECTION.DISCONNECT);
    CONNECTION.disconnect = (guid) => dispatch => {
        Store.update(state => {
            if (state.connected === guid) {
                state.connected = undefined;
                // dispatch action
                dispatch(disconnectPure(guid));
            }
            return state;
        });
    };
    const errPure = redux_actions_1.createAction(CONNECTION.ERR);
    CONNECTION.err = (guid) => dispatch => {
        // update the internal state
        Store.update(state => {
            state.erred = _.uniq(_.concat([guid], state.erred));
            // state.erred;
            return state;
        });
        // dispatch action
        dispatch(errPure(guid));
    };
    CONNECTION.showNewConnectionView = redux_actions_1.createAction(CONNECTION.SHOW_NEW_CONNECTION_VIEW);
})(CONNECTION = exports.CONNECTION || (exports.CONNECTION = {}));
var PROTOCOL;
(function (PROTOCOL) {
    PROTOCOL.LOG_REQUEST = 'PROTOCOL.LOG_REQUEST';
    PROTOCOL.LOG_RESPONSES = 'PROTOCOL.LOG_RESPONSE';
    PROTOCOL.CLEAR_ALL = 'PROTOCOL.CLEAR_ALL';
    PROTOCOL.TOGGLE_LSP = 'PROTOCOL.TOGGLE_LSP';
    PROTOCOL.logRequest = redux_actions_1.createAction(PROTOCOL.LOG_REQUEST);
    PROTOCOL.logResponses = redux_actions_1.createAction(PROTOCOL.LOG_RESPONSES);
    PROTOCOL.clearAll = redux_actions_1.createAction(PROTOCOL.CLEAR_ALL);
    PROTOCOL.toggleLSP = redux_actions_1.createAction(PROTOCOL.TOGGLE_LSP);
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
    BODY.UPDATE_BODY = 'BODY.UPDATE_BODY';
    BODY.UPDATE_ERROR = 'BODY.UPDATE_ERROR';
    BODY.UPDATE_SOLUTIONS = 'BODY.UPDATE_SOLUTIONS';
    BODY.UPDATE_PLAIN_TEXT = 'BODY.UPDATE_PLAIN_TEXT';
    BODY.UPDATE_MAX_BODY_HEIGHT = 'BODY.UPDATE_MAX_BODY_HEIGHT';
})(BODY = exports.BODY || (exports.BODY = {}));
exports.updateBody = redux_actions_1.createAction(BODY.UPDATE_BODY);
exports.updateError = redux_actions_1.createAction(BODY.UPDATE_ERROR);
exports.updateSolutions = redux_actions_1.createAction(BODY.UPDATE_SOLUTIONS);
exports.updatePlainText = redux_actions_1.createAction(BODY.UPDATE_PLAIN_TEXT);
exports.updateMaxBodyHeight = redux_actions_1.createAction(BODY.UPDATE_MAX_BODY_HEIGHT);
var SETTINGS;
(function (SETTINGS) {
    SETTINGS.NAVIGATE = 'SETTINGS.NAVIGATE';
    SETTINGS.navigate = redux_actions_1.createAction(SETTINGS.NAVIGATE);
})(SETTINGS = exports.SETTINGS || (exports.SETTINGS = {}));
//# sourceMappingURL=actions.js.map