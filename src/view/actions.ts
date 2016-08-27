import * as Promise from 'bluebird'
import { createAction, handleAction, handleActions, Action } from 'redux-actions';
// import { State, Section, LanguageSection, History } from './types';


export type INPUT_METHOD = INPUT_METHOD.ACTIVATE | INPUT_METHOD.DEACTIVATE | INPUT_METHOD.INSERT | INPUT_METHOD.DELETE;
export namespace INPUT_METHOD {
    export const ACTIVATE = 'INPUT_METHOD.ACTIVATE';
    export type ACTIVATE = void;
    export const DEACTIVATE = 'INPUT_METHOD.DEACTIVATE';
    export type DEACTIVATE = void;
    export const INSERT = 'INPUT_METHOD.INSERT';
    export type INSERT = string;
    export const DELETE = 'INPUT_METHOD.DELETE';
    export type DELETE = void;
}

 export const activateInputMethod = createAction<INPUT_METHOD.ACTIVATE, INPUT_METHOD.ACTIVATE>(INPUT_METHOD.ACTIVATE);
 export const deactivateInputMethod = createAction<INPUT_METHOD.DEACTIVATE, INPUT_METHOD.DEACTIVATE>(INPUT_METHOD.DEACTIVATE);
 export const insertInputMethod = createAction<INPUT_METHOD.INSERT, INPUT_METHOD.INSERT>(INPUT_METHOD.INSERT);
 export const deleteInputMethod = createAction<INPUT_METHOD.DELETE, INPUT_METHOD.DELETE>(INPUT_METHOD.DELETE);

// export namespace fetch {
//     export const init = createAction<string, FETCH.INIT>(FETCH.INIT);
//     export const succ = createAction<LanguageSection[], FETCH.SUCC>(FETCH.SUCC);
//     export const fail = createAction<Error, FETCH.FAIL>(FETCH.FAIL);
// }
//
// export namespace status {
//     export const init = createAction(STATUS.INIT);
//     export const succ = createAction(STATUS.SUCC);
//     export const fail = createAction(STATUS.FAIL);
// }
//
// export namespace historyLookup {
//     export const init = createAction<string, LOOKUP.INIT>(LOOKUP.INIT);
//     export const fail = createAction<Error, LOOKUP.FAIL>(LOOKUP.FAIL);
// }
//
// export namespace historyBackward {
//     export const init = createAction<string, BACKWARD.INIT>(BACKWARD.INIT);
//     export const fail = createAction<Error, BACKWARD.FAIL>(BACKWARD.FAIL);
// }
//
// export namespace historyForward {
//     export const init = createAction<string, FORWARD.INIT>(FORWARD.INIT);
//     export const fail = createAction<Error, FORWARD.FAIL>(FORWARD.FAIL);
// }
//
// export const lookup = (target: string) => (dispatch: any, getState: () => State) => {
//     dispatch(fetch.init(target));
//     dispatch(status.init());
//     dispatch(historyLookup.init(target));
//     fetchEntry(target).then(
//         res => {
//             dispatch(fetch.succ(res));
//             dispatch(status.succ());
//         },
//         err => {
//             dispatch(fetch.fail(err));
//             dispatch(status.fail());
//             dispatch(historyLookup.fail(err));
//         }
//     );
// }
//
// export const backward = (dispatch: any, getState: () => State) => {
//     const history = getState().history;
//     const target = lastTarget(history.present);
//
//     dispatch(fetch.init(target));
//     dispatch(status.init());
//     dispatch(historyBackward.init(target));
//     fetchEntry(target).then(
//         res => {
//             dispatch(fetch.succ(res));
//             dispatch(status.succ());
//         },
//         err => {
//             dispatch(fetch.fail(err));
//             dispatch(status.fail());
//             dispatch(historyBackward.fail(err));
//         }
//     )
// }
//
// export const forward = (dispatch: any, getState: () => State) => {
//     const history = getState().history;
//     const target = nextTarget(history.present);
//
//     dispatch(fetch.init(target));
//     dispatch(status.init());
//     dispatch(historyForward.init(target));
//     fetchEntry(target).then(
//         res => {
//             dispatch(fetch.succ(res));
//             dispatch(status.succ());
//         },
//         err => {
//             dispatch(fetch.fail(err));
//             dispatch(status.fail());
//             dispatch(historyForward.fail(err));
//         }
//     )
// }
//
// export function lastTarget(history: History): string {
//     if (history.cursor >= 1) {
//         return history.words[history.cursor - 1];
//     } else {
//         return null;
//     }
// }
//
// export function nextTarget(history: History): string {
//     if (history.cursor < history.words.length) {
//         return history.words[history.cursor + 1];
//     } else {
//         return null;
//     }
// }
