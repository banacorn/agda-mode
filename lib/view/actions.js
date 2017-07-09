"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const redux_actions_1 = require("redux-actions");
const Store = require("../persist");
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
    MODE.INQUIRE_CONNECTION = 'MODE.INQUIRE_CONNECTION';
    MODE.display = redux_actions_1.createAction(MODE.DISPLAY);
    MODE.query = redux_actions_1.createAction(MODE.QUERY);
    MODE.inquireConnection = redux_actions_1.createAction(MODE.INQUIRE_CONNECTION);
})(MODE = exports.MODE || (exports.MODE = {}));
var CONNECTION;
(function (CONNECTION) {
    CONNECTION.ADD_CONNECTION = 'CONNECTION.ADD_CONNECTION';
    CONNECTION.REMOVE_CONNECTION = 'CONNECTION.REMOVE_CONNECTION';
    CONNECTION.SELECT_CONNECTION = 'CONNECTION.SELECT_CONNECTION';
    CONNECTION.CONNECT = 'CONNECTION.CONNECT';
    CONNECTION.DISCONNECT = 'CONNECTION.DISCONNECT';
    CONNECTION.SHOW_NEW_CONNECTION_VIEW = 'CONNECTION.SHOW_NEW_CONNECTION_VIEW';
    const addConnectionPure = redux_actions_1.createAction(CONNECTION.ADD_CONNECTION);
    CONNECTION.addConnection = (connInfo) => dispatch => {
        // update the internal state
        Store.update(state => {
            const exists = _.find(state.connections, {
                guid: connInfo.guid
            });
            if (!exists) {
                state.connections.push({
                    guid: connInfo.guid,
                    uri: connInfo.uri,
                    version: connInfo.version
                });
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
        // update the internal state
        Store.update(state => {
            state.connected = guid;
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
    CONNECTION.showNewConnectionView = redux_actions_1.createAction(CONNECTION.SHOW_NEW_CONNECTION_VIEW);
})(CONNECTION = exports.CONNECTION || (exports.CONNECTION = {}));
var DEV;
(function (DEV) {
    DEV.ADD_REQUEST = 'DEV.ADD_REQUEST';
    DEV.ADD_RESPONSE = 'DEV.ADD_RESPONSE';
    DEV.CLEAR_ALL = 'DEV.CLEAR_ALL';
    DEV.TOGGLE_ACCUMULATE = 'DEV.TOGGLE_ACCUMULATE';
    DEV.TOGGLE_LSP = 'DEV.TOGGLE_LSP';
    DEV.addRequest = redux_actions_1.createAction(DEV.ADD_REQUEST);
    DEV.addResponse = redux_actions_1.createAction(DEV.ADD_RESPONSE);
    DEV.clearAll = redux_actions_1.createAction(DEV.CLEAR_ALL);
    DEV.toggleAccumulate = redux_actions_1.createAction(DEV.TOGGLE_ACCUMULATE);
    DEV.toggleLSP = redux_actions_1.createAction(DEV.TOGGLE_LSP);
})(DEV = exports.DEV || (exports.DEV = {}));
var INPUT_METHOD;
(function (INPUT_METHOD) {
    INPUT_METHOD.ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    INPUT_METHOD.DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    INPUT_METHOD.INSERT = 'INPUT_METHOD.INSERT';
    INPUT_METHOD.DELETE = 'INPUT_METHOD.DELETE';
    INPUT_METHOD.REPLACE_SYMBOL = 'INPUT_METHOD.REPLACE_SYMBOL';
    INPUT_METHOD.ENABLE_IN_MINI_EDITOR = 'INPUT_METHOD.ENABLE_IN_MINI_EDITOR';
    INPUT_METHOD.activate = redux_actions_1.createAction(INPUT_METHOD.ACTIVATE);
    INPUT_METHOD.deactivate = redux_actions_1.createAction(INPUT_METHOD.DEACTIVATE);
    INPUT_METHOD.insertChar = redux_actions_1.createAction(INPUT_METHOD.INSERT);
    INPUT_METHOD.deleteChar = redux_actions_1.createAction(INPUT_METHOD.DELETE);
    INPUT_METHOD.replaceSymbol = redux_actions_1.createAction(INPUT_METHOD.REPLACE_SYMBOL);
    INPUT_METHOD.enableInMiniEditor = redux_actions_1.createAction(INPUT_METHOD.ENABLE_IN_MINI_EDITOR);
})(INPUT_METHOD = exports.INPUT_METHOD || (exports.INPUT_METHOD = {}));
var HEADER;
(function (HEADER) {
    HEADER.UPDATE = 'HEADER.UPDATE';
    HEADER.update = redux_actions_1.createAction(HEADER.UPDATE);
})(HEADER = exports.HEADER || (exports.HEADER = {}));
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