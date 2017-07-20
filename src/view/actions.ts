import * as _ from 'lodash';
import * as Promise from 'bluebird'
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { View, Error, Location, Connection, ConnectionInfo, GUID } from '../type';
import * as Store from '../persist';
declare var atom: any;

export type EVENT =
    EVENT.JUMP_TO_GOAL |
    EVENT.JUMP_TO_LOCATION;
export namespace EVENT {
    export const JUMP_TO_GOAL = 'EVENT.JUMP_TO_GOAL';
    export type JUMP_TO_GOAL = number;
    export const JUMP_TO_LOCATION = 'EVENT.JUMP_TO_LOCATION';
    export type JUMP_TO_LOCATION = Location;
}

export type VIEW
    = VIEW.ACTIVATE
    | VIEW.DEACTIVATE
    | VIEW.MOUNT
    | VIEW.UNMOUNT
    | VIEW.MOUNT_AT_PANE
    | VIEW.MOUNT_AT_BOTTOM
    | VIEW.TOGGLE_SETTINGS_VIEW
export namespace VIEW {
    export const ACTIVATE = 'VIEW.ACTIVATE';
    export type ACTIVATE = void;
    export const DEACTIVATE = 'VIEW.DEACTIVATE';
    export type DEACTIVATE = void;
    export const MOUNT = 'VIEW.MOUNT';
    export type MOUNT = void;
    export const UNMOUNT = 'VIEW.UNMOUNT';
    export type UNMOUNT = void;
    export const MOUNT_AT_PANE = 'VIEW.MOUNT_AT_PANE';
    export type MOUNT_AT_PANE = void;
    export const MOUNT_AT_BOTTOM = 'VIEW.MOUNT_AT_BOTTOM';
    export type MOUNT_AT_BOTTOM = void;
    export const TOGGLE_SETTINGS_VIEW = 'VIEW.TOGGLE_SETTINGS_VIEW';
    export type TOGGLE_SETTINGS_VIEW = void;

    export const activate = createAction(VIEW.ACTIVATE);
    export const deactivate = createAction(VIEW.DEACTIVATE);
    export const mount = createAction(VIEW.MOUNT);
    export const unmount = createAction(VIEW.UNMOUNT);
    export const mountAtPane = createAction(VIEW.MOUNT_AT_PANE);
    export const mountAtBottom = createAction(VIEW.MOUNT_AT_BOTTOM);
    export const toggleSettings = createAction(VIEW.TOGGLE_SETTINGS_VIEW);
}

export type MODE =
    MODE.DISPLAY |
    MODE.QUERY |
    MODE.QUERY_CONNECTION;
export namespace MODE {
    export const DISPLAY = 'MODE.DISPLAY';
    export type DISPLAY = void;
    export const QUERY = 'MODE.QUERY';
    export type QUERY = void;
    export const QUERY_CONNECTION = 'MODE.QUERY_CONNECTION';
    export type QUERY_CONNECTION = void;

    export const display = createAction(MODE.DISPLAY);
    export const query = createAction(MODE.QUERY);
    export const queryConnection = createAction(MODE.QUERY_CONNECTION);
}

export type CONNECTION
    = CONNECTION.ADD_CONNECTION
    | CONNECTION.REMOVE_CONNECTION
    | CONNECTION.SELECT_CONNECTION
    | CONNECTION.CONNECT
    | CONNECTION.DISCONNECT
    | CONNECTION.SHOW_NEW_CONNECTION_VIEW

export namespace CONNECTION {
    export const ADD_CONNECTION = 'CONNECTION.ADD_CONNECTION';
    export type ADD_CONNECTION = ConnectionInfo;
    export const REMOVE_CONNECTION = 'CONNECTION.REMOVE_CONNECTION';
    export type REMOVE_CONNECTION = GUID;
    export const SELECT_CONNECTION = 'CONNECTION.SELECT_CONNECTION';
    export type SELECT_CONNECTION = GUID;
    export const CONNECT = 'CONNECTION.CONNECT';
    export type CONNECT = GUID;
    export const DISCONNECT = 'CONNECTION.DISCONNECT';
    export type DISCONNECT = GUID;
    export const SHOW_NEW_CONNECTION_VIEW = 'CONNECTION.SHOW_NEW_CONNECTION_VIEW';
    export type SHOW_NEW_CONNECTION_VIEW = boolean;

    const addConnectionPure = createAction(CONNECTION.ADD_CONNECTION);
    export const addConnection = (connInfo: ConnectionInfo) => dispatch => {
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
    }

    const removeConnectionPure = createAction(CONNECTION.REMOVE_CONNECTION);
    export const removeConnection = (guid: GUID) => dispatch => {
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
    }

    const selectConnectionPure = createAction(CONNECTION.SELECT_CONNECTION);
    export const selectConnection = (guid: GUID) => dispatch => {
        // update the internal state
        Store.update(state => {
            state.selected = guid;
            return state;
        });
        // dispatch action
        dispatch(selectConnectionPure(guid));
    }

    const connectPure = createAction(CONNECTION.CONNECT);
    export const connect = (guid: GUID) => dispatch => {
        // update the internal state
        Store.update(state => {
            state.connected = guid;
            return state;
        });
        // dispatch action
        dispatch(connectPure(guid));
    }

    const disconnectPure = createAction(CONNECTION.DISCONNECT);
    export const disconnect = (guid: GUID) => dispatch => {
        Store.update(state => {
            if (state.connected === guid) {
                state.connected = undefined;
                // dispatch action
                dispatch(disconnectPure(guid));
            }
            return state;
        });
    }
    export const showNewConnectionView = createAction(SHOW_NEW_CONNECTION_VIEW);
}


export type DEV
    = DEV.ADD_REQUEST
    | DEV.ADD_RESPONSE
    | DEV.CLEAR_ALL
    | DEV.TOGGLE_ACCUMULATE
    | DEV.TOGGLE_LSP

export namespace DEV {
    export const ADD_REQUEST = 'DEV.ADD_REQUEST';
    export type ADD_REQUEST = string;
    export const ADD_RESPONSE = 'DEV.ADD_RESPONSE';
    export type ADD_RESPONSE = string;
    export const CLEAR_ALL = 'DEV.CLEAR_ALL';
    export type CLEAR_ALL = void;
    export const TOGGLE_ACCUMULATE = 'DEV.TOGGLE_ACCUMULATE';
    export type TOGGLE_ACCUMULATE = void;
    export const TOGGLE_LSP = 'DEV.TOGGLE_LSP';
    export type TOGGLE_LSP = void;

    export const addRequest = createAction(DEV.ADD_REQUEST);
    export const addResponse = createAction(DEV.ADD_RESPONSE);
    export const clearAll = createAction(DEV.CLEAR_ALL);
    export const toggleAccumulate = createAction(DEV.TOGGLE_ACCUMULATE);
    export const toggleLSP = createAction(DEV.TOGGLE_LSP);
}


export type INPUT_METHOD = INPUT_METHOD.ACTIVATE
    | INPUT_METHOD.DEACTIVATE
    | INPUT_METHOD.INSERT
    | INPUT_METHOD.DELETE
    | INPUT_METHOD.REPLACE_SYMBOL

export namespace INPUT_METHOD {
    export const ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    export type ACTIVATE = void;
    export const DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    export type DEACTIVATE = void;
    export const INSERT = 'INPUT_METHOD.INSERT';
    export type INSERT = string;
    export const DELETE = 'INPUT_METHOD.DELETE';
    export type DELETE = void;
    export const REPLACE_SYMBOL = 'INPUT_METHOD.REPLACE_SYMBOL';
    export type REPLACE_SYMBOL = string;

    export const activate = createAction(INPUT_METHOD.ACTIVATE);
    export const deactivate = createAction(INPUT_METHOD.DEACTIVATE);
    export const insertChar = createAction(INPUT_METHOD.INSERT);
    export const deleteChar = createAction(INPUT_METHOD.DELETE);
    export const replaceSymbol = createAction(INPUT_METHOD.REPLACE_SYMBOL);
}


export type HEADER = HEADER.UPDATE;
export namespace HEADER {
    export const UPDATE = 'HEADER.UPDATE';
    export type UPDATE = View.HeaderState;

    export const update = createAction(HEADER.UPDATE);
}

export type QUERY = QUERY.SET_PLACEHOLDER | QUERY.UPDATE_VALUE;
export namespace QUERY {
    export const SET_PLACEHOLDER = 'QUERY.SET_PLACEHOLDER';
    export type SET_PLACEHOLDER = string;
    export const UPDATE_VALUE = 'QUERY.UPDATE_VALUE';
    export type UPDATE_VALUE = string;

    export const updateValue = createAction(QUERY.UPDATE_VALUE);
    export const setPlaceholder = createAction(QUERY.SET_PLACEHOLDER);
}


export type BODY = BODY.UPDATE_BANNER | BODY.UPDATE_BODY | BODY.UPDATE_ERROR | BODY.UPDATE_PLAIN_TEXT | BODY.UPDATE_MAX_BODY_HEIGHT;
export namespace BODY {
    export const UPDATE_BANNER = 'BODY.UPDATE_BANNER';
    export type UPDATE_BANNER = View.BannerItem[];
    export const UPDATE_BODY = 'BODY.UPDATE_BODY';
    export type UPDATE_BODY = View.Body;
    export const UPDATE_ERROR = 'BODY.UPDATE_ERROR';
    export type UPDATE_ERROR = Error;
    export const UPDATE_PLAIN_TEXT = 'BODY.UPDATE_PLAIN_TEXT';
    export type UPDATE_PLAIN_TEXT = string;
    export const UPDATE_MAX_BODY_HEIGHT = 'BODY.UPDATE_MAX_BODY_HEIGHT';
    export type UPDATE_MAX_BODY_HEIGHT = number;
}

export const updateBanner = createAction(BODY.UPDATE_BANNER);
export const updateBody = createAction(BODY.UPDATE_BODY);
export const updateError = createAction(BODY.UPDATE_ERROR);
export const updatePlainText = createAction(BODY.UPDATE_PLAIN_TEXT);
export const updateMaxBodyHeight = createAction(BODY.UPDATE_MAX_BODY_HEIGHT);


export type SETTINGS = SETTINGS.NAVIGATE;
export namespace SETTINGS {
    export const NAVIGATE = 'SETTINGS.NAVIGATE';
    export type NAVIGATE = View.SettingsPath;

    export const navigate = createAction(SETTINGS.NAVIGATE);
}
