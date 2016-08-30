import * as Promise from 'bluebird'
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
import { View } from '../types';


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

export type INPUT_EDITOR =
    INPUT_EDITOR.ACTIVATE |
    INPUT_EDITOR.DEACTIVATE;
export namespace INPUT_EDITOR {
    export const ACTIVATE = 'INPUT_EDITOR.ACTIVATE';
    export type ACTIVATE = string;
    export const DEACTIVATE = 'INPUT_EDITOR.DEACTIVATE';
    export type DEACTIVATE = void;
    export const FOCUSED = 'INPUT_EDITOR.FOCUSED';
    export type FOCUSED = void;
    export const BLURRED = 'INPUT_EDITOR.BLURRED';
    export type BLURRED = void;
}

export const activateInputEditor = createAction(INPUT_EDITOR.ACTIVATE);
export const deactivateInputEditor = createAction(INPUT_EDITOR.DEACTIVATE);
export const focusedInputEditor = createAction(INPUT_EDITOR.FOCUSED);
export const blurredInputEditor = createAction(INPUT_EDITOR.BLURRED);
