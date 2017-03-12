import * as Promise from 'bluebird'
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { View, Error, Location } from '../types';

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
    | VIEW.TOGGLE_DEV_VIEW
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
    export const TOGGLE_DEV_VIEW = 'VIEW.TOGGLE_DEV_VIEW';
    export type TOGGLE_DEV_VIEW = void;
}

export const activateView = createAction(VIEW.ACTIVATE);
export const deactivateView = createAction(VIEW.DEACTIVATE);
export const mountView = createAction(VIEW.MOUNT);
export const unmountView = createAction(VIEW.UNMOUNT);
export const mountAtPane = createAction(VIEW.MOUNT_AT_PANE);
export const mountAtBottom = createAction(VIEW.MOUNT_AT_BOTTOM);
export const toggleDevView = createAction(VIEW.TOGGLE_DEV_VIEW);

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
}

export const devAddRequest = createAction(DEV.ADD_REQUEST);
export const devAddResponse = createAction(DEV.ADD_RESPONSE);
export const devClearAll = createAction(DEV.CLEAR_ALL);
export const devToggleAccumulate = createAction(DEV.TOGGLE_ACCUMULATE);
export const devToggleLSP = createAction(DEV.TOGGLE_LSP);

export type INPUT_METHOD = INPUT_METHOD.ACTIVATE
    | INPUT_METHOD.DEACTIVATE
    | INPUT_METHOD.INSERT
    | INPUT_METHOD.DELETE
    | INPUT_METHOD.REPLACE_SYMBOL
    | INPUT_METHOD.ENABLE_IN_MINI_EDITOR

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
    export const ENABLE_IN_MINI_EDITOR = 'INPUT_METHOD.ENABLE_IN_MINI_EDITOR';
    export type ENABLE_IN_MINI_EDITOR = boolean;
}

export const activateInputMethod = createAction(INPUT_METHOD.ACTIVATE);
export const deactivateInputMethod = createAction(INPUT_METHOD.DEACTIVATE);
export const insertInputMethod = createAction(INPUT_METHOD.INSERT);
export const deleteInputMethod = createAction(INPUT_METHOD.DELETE);
export const replaceSymbol = createAction(INPUT_METHOD.REPLACE_SYMBOL);
export const enableInMiniEditor = createAction(INPUT_METHOD.ENABLE_IN_MINI_EDITOR);

export type HEADER = HEADER.UPDATE;
export namespace HEADER {
    export const UPDATE = 'HEADER.UPDATE';
    export type UPDATE = View.HeaderState;
}

export const updateHeader = createAction(HEADER.UPDATE);

export type MINI_EDITOR =
    MINI_EDITOR.ACTIVATE |
    MINI_EDITOR.DEACTIVATE;
export namespace MINI_EDITOR {
    export const ACTIVATE = 'MINI_EDITOR.ACTIVATE';
    export type ACTIVATE = string;
    export const DEACTIVATE = 'MINI_EDITOR.DEACTIVATE';
    export type DEACTIVATE = void;
}

export const activateMiniEditor = createAction(MINI_EDITOR.ACTIVATE);
export const deactivateMiniEditor = createAction(MINI_EDITOR.DEACTIVATE);

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

export const updateBanner = createAction<BODY.UPDATE_BANNER, BODY.UPDATE_BANNER>(BODY.UPDATE_BANNER);
export const updateBody = createAction<BODY.UPDATE_BODY, BODY.UPDATE_BODY>(BODY.UPDATE_BODY);
export const updateError = createAction<BODY.UPDATE_ERROR, BODY.UPDATE_ERROR>(BODY.UPDATE_ERROR);
export const updatePlainText = createAction<BODY.UPDATE_PLAIN_TEXT, BODY.UPDATE_PLAIN_TEXT>(BODY.UPDATE_PLAIN_TEXT);
export const updateMaxBodyHeight = createAction<BODY.UPDATE_MAX_BODY_HEIGHT, BODY.UPDATE_MAX_BODY_HEIGHT>(BODY.UPDATE_MAX_BODY_HEIGHT);
