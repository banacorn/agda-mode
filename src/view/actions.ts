import * as _ from 'lodash';
import * as Promise from 'bluebird'
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { Parsed, Agda, View, Location } from '../type';
import { AgdaError } from '../parser';

// export type EVENT =
//     EVENT.JUMP_TO_GOAL |
//     EVENT.JUMP_TO_LOCATION |
//     EVENT.FILL_IN_SOLUTION;
export namespace EVENT {
    export const JUMP_TO_GOAL = 'EVENT.JUMP_TO_GOAL';
    export const JUMP_TO_LOCATION = 'EVENT.JUMP_TO_LOCATION';
    export const FILL_IN_SIMPLE_SOLUTION = 'EVENT.FILL_IN_SIMPLE_SOLUTION';
    export const FILL_IN_INDEXED_SOLUTIONS = 'EVENT.FILL_IN_INDEXED_SOLUTIONS';
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
    = CONNECTION.CONNECT
    | CONNECTION.DISCONNECT

export namespace CONNECTION {
    export const CONNECT = 'CONNECTION.CONNECT';
    export type CONNECT = View.ConnectionState;
    export const DISCONNECT = 'CONNECTION.DISCONNECT';
    export type DISCONNECT = void;

    export const connect = createAction<CONNECTION.CONNECT>(CONNECTION.CONNECT);
    export const disconnect = createAction(CONNECTION.DISCONNECT);
}

export type PROTOCOL
    = PROTOCOL.LOG_REQUEST
    | PROTOCOL.LOG_RESPONSES
    | PROTOCOL.CLEAR_ALL
    | PROTOCOL.TOGGLE_LSP
    | PROTOCOL.PENDING

export namespace PROTOCOL {
    export const LOG_REQUEST = 'PROTOCOL.LOG_REQUEST';
    export type LOG_REQUEST = Parsed<Agda.Command>;
    export const LOG_RESPONSES = 'PROTOCOL.LOG_RESPONSE';
    export type LOG_RESPONSES = Parsed<Agda.Response>[];

    export const CLEAR_ALL = 'PROTOCOL.CLEAR_ALL';
    export type CLEAR_ALL = void;

    export const TOGGLE_LSP = 'PROTOCOL.TOGGLE_LSP';
    export type TOGGLE_LSP = void;

    export const PENDING = 'PROTOCOL.PENDING';
    export type PENDING = boolean;

    export const logRequest = createAction<PROTOCOL.LOG_REQUEST>(PROTOCOL.LOG_REQUEST);
    export const logResponses = createAction<PROTOCOL.LOG_RESPONSES>(PROTOCOL.LOG_RESPONSES);
    export const clearAll = createAction(PROTOCOL.CLEAR_ALL);
    export const toggleLSP = createAction(PROTOCOL.TOGGLE_LSP);
    export const pending = createAction<PROTOCOL.PENDING>(PROTOCOL.PENDING);
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
    export const insertChar = createAction<INPUT_METHOD.INSERT>(INPUT_METHOD.INSERT);
    export const deleteChar = createAction(INPUT_METHOD.DELETE);
    export const replaceSymbol = createAction<INPUT_METHOD.REPLACE_SYMBOL>(INPUT_METHOD.REPLACE_SYMBOL);
}


export type HEADER = HEADER.UPDATE;
export namespace HEADER {
    export const UPDATE = 'HEADER.UPDATE';
    export type UPDATE = View.HeaderState;

    export const update = createAction<HEADER.UPDATE>(HEADER.UPDATE);
}

export type QUERY = QUERY.SET_PLACEHOLDER | QUERY.UPDATE_VALUE;
export namespace QUERY {
    export const SET_PLACEHOLDER = 'QUERY.SET_PLACEHOLDER';
    export type SET_PLACEHOLDER = string;
    export const UPDATE_VALUE = 'QUERY.UPDATE_VALUE';
    export type UPDATE_VALUE = string;

    export const updateValue = createAction<QUERY.UPDATE_VALUE>(QUERY.UPDATE_VALUE);
    export const setPlaceholder = createAction<QUERY.SET_PLACEHOLDER>(QUERY.SET_PLACEHOLDER);
}


export type BODY = BODY.UPDATE_BODY
    | BODY.UPDATE_ERROR
    | BODY.UPDATE_SOLUTIONS
    | BODY.UPDATE_PLAIN_TEXT
    | BODY.UPDATE_MAX_BODY_HEIGHT;
export namespace BODY {
    export const UPDATE_BODY = 'BODY.UPDATE_BODY';
    export type UPDATE_BODY = View.Body;
    export const UPDATE_ERROR = 'BODY.UPDATE_ERROR';
    export type UPDATE_ERROR = AgdaError;
    export const UPDATE_SOLUTIONS = 'BODY.UPDATE_SOLUTIONS';
    export type UPDATE_SOLUTIONS = View.Solutions;
    export const UPDATE_PLAIN_TEXT = 'BODY.UPDATE_PLAIN_TEXT';
    export type UPDATE_PLAIN_TEXT = string;
    export const UPDATE_MAX_BODY_HEIGHT = 'BODY.UPDATE_MAX_BODY_HEIGHT';
    export type UPDATE_MAX_BODY_HEIGHT = number;
}

export const updateBody = createAction<BODY.UPDATE_BODY>(BODY.UPDATE_BODY);
export const updateError = createAction<BODY.UPDATE_ERROR>(BODY.UPDATE_ERROR);
export const updateSolutions = createAction<BODY.UPDATE_SOLUTIONS>(BODY.UPDATE_SOLUTIONS);
export const updatePlainText = createAction<BODY.UPDATE_PLAIN_TEXT>(BODY.UPDATE_PLAIN_TEXT);
export const updateMaxBodyHeight = createAction<BODY.UPDATE_MAX_BODY_HEIGHT>(BODY.UPDATE_MAX_BODY_HEIGHT);


export type SETTINGS = SETTINGS.NAVIGATE;
export namespace SETTINGS {
    export const NAVIGATE = 'SETTINGS.NAVIGATE';
    export type NAVIGATE = View.SettingsPath;

    export const navigate = createAction<SETTINGS.NAVIGATE>(SETTINGS.NAVIGATE);
}
