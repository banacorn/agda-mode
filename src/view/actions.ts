import * as Promise from 'bluebird'
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { View, Error } from '../types';


export type INPUT_METHOD = INPUT_METHOD.ACTIVATE | INPUT_METHOD.DEACTIVATE | INPUT_METHOD.INSERT | INPUT_METHOD.DELETE | INPUT_METHOD.REPLACE_SYMBOL;
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
}

export const activateInputMethod = createAction(INPUT_METHOD.ACTIVATE);
export const deactivateInputMethod = createAction(INPUT_METHOD.DEACTIVATE);
export const insertInputMethod = createAction(INPUT_METHOD.INSERT);
export const deleteInputMethod = createAction(INPUT_METHOD.DELETE);
export const replaceSymbol = createAction(INPUT_METHOD.REPLACE_SYMBOL);

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

export type BODY = BODY.UPDATE_BANNER | BODY.UPDATE_BODY | BODY.UPDATE_ERROR | BODY.UPDATE_PLAIN_TEXT;
export namespace BODY {
    export const UPDATE_BANNER = 'BODY.UPDATE_BANNER';
    export type UPDATE_BANNER = View.BannerItem[];
    export const UPDATE_BODY = 'BODY.UPDATE_BODY';
    export type UPDATE_BODY = View.Body;
    export const UPDATE_ERROR = 'BODY.UPDATE_ERROR';
    export type UPDATE_ERROR = Error;
    export const UPDATE_PLAIN_TEXT = 'BODY.UPDATE_PLAIN_TEXT';
    export type UPDATE_PLAIN_TEXT = string;
}

export const updateBanner = createAction<BODY.UPDATE_BANNER, BODY.UPDATE_BANNER>(BODY.UPDATE_BANNER);
export const updateBody = createAction<BODY.UPDATE_BODY, BODY.UPDATE_BODY>(BODY.UPDATE_BODY);
export const updateError = createAction<BODY.UPDATE_ERROR, BODY.UPDATE_ERROR>(BODY.UPDATE_ERROR);
export const updatePlainText = createAction<BODY.UPDATE_PLAIN_TEXT, BODY.UPDATE_PLAIN_TEXT>(BODY.UPDATE_PLAIN_TEXT);
