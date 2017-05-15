import * as Promise from 'bluebird';
// import * as _ from 'lodash';
// import { spawn, exec, ChildProcess } from 'child_process';
import { parseFilepath, parseAgdaResponse } from './parser';
// import Rectifier from './parser/stream/rectifier';
// import { handleAgdaResponse } from './handler';
// import { InvalidExecutablePathError, ProcExecError, AutoExecPathSearchError, AgdaParseError } from './error';
import { Connection, View, Goal, Normalization } from './type';
// import Core from './core';
// import * as Action from './view/actions';

var semver = require('semver');
declare var atom: any;

Promise.longStackTraces();  // for debugging

function getLibraryPath(): string {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${ parseFilepath(p) }\"`; }).join(', ');
}

const sendCommand = (highlightingLevel: string, interaction: string | ((conn: Connection) => string)) => (conn: Connection): Promise<{}> => {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let command: string;
    if (typeof interaction === 'string') {
        command = `IOTCM \"${conn.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`
    } else {    // interaction is a callback
        command = `IOTCM \"${conn.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction(conn)} )\n`;
    }
    conn.stream.write(command);
    console.log(command)
    return Promise.resolve({});
}

export const load = sendCommand('NonInteractive', (conn) => {
    // if version > 2.5, ignore library path configuration
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_load \"${conn.filepath}\" []`
    else
        return `Cmd_load \"${conn.filepath}\" [${getLibraryPath()}]`
});

export const compile = sendCommand('NonInteractive', (conn) => {
    const backend = atom.config.get('agda-mode.backend');
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_compile ${backend} \"${conn.filepath}\" []`
    else
        return `Cmd_compile ${backend} \"${conn.filepath}\" [${getLibraryPath()}]`
});

export const toggleDisplayOfImplicitArguments =
    sendCommand('NonInteractive', 'ToggleImplicitArgs');

export const solveConstraints =
    sendCommand('NonInteractive', 'Cmd_solveAll');

export const showConstraints =
    sendCommand('NonInteractive', 'Cmd_constraints');

export const showGoals =
    sendCommand('NonInteractive', 'Cmd_metas');

export const whyInScope = (expr: string, goal?: Goal) => {
    if (goal) {
        return sendCommand('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
    } else {
        return sendCommand('None', `Cmd_why_in_scope_toplevel \"${expr}\"`);
    }
}

export const inferType = (normalization: Normalization, goal?: Goal) => (expr: string) => {
        if (goal) {
            return sendCommand('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
        } else {
            return sendCommand('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
        }
    }

export const moduleContents = (normalization: Normalization, expr: string) => (goal?: Goal) => {
        if (goal) {
            return sendCommand('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
        } else {
            return sendCommand('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
        }
    }
//
//     computeNormalForm = (computeMode: ComputeMode, goal?: Goal): (expr: string) => Promise<ChildProcess> => {
//         if (semver.gte(this.agdaVersion.sem, '2.5.2')) {  // after 2.5.2
//             return (expr) => {
//                 if (goal) {
//                     return this.sendCommand('NonInteractive', `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`);
//                 } else {
//                     return this.sendCommand('None', `Cmd_compute_toplevel ${computeMode} \"${expr}\"`);
//                 }
//             }
//         } else { // prior to 2.6
//             const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
//
//             return (expr) => {
//                 if (goal) {
//                     return this.sendCommand('NonInteractive', `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`);
//                 } else {
//                     return this.sendCommand('None', `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`);
//                 }
//             }
//         }
//     }
//
//     give = (goal: Goal): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', `Cmd_give ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
//     }
//
//     refine = (goal: Goal): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', `Cmd_refine_or_intro False ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
//     }
//
//     auto = (goal: Goal): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', `Cmd_auto ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
//     }
//
//     'case' = (goal: Goal): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', `Cmd_make_case ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
//     }
//
//     goalType = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
//         return (goal) => {
//             return this.sendCommand('NonInteractive', `Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`);
//         };
//     }
//
//     context = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
//         return (goal) => {
//             return this.sendCommand('NonInteractive', `Cmd_context ${normalization} ${goal.index} noRange \"\"`);
//         };
//     }
//
//     goalTypeAndContext = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
//         return (goal) => {
//             return this.sendCommand('NonInteractive', `Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`);
//         };
//     }
//
//     goalTypeAndInferredType = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
//         return (goal) => {
//             return this.sendCommand('NonInteractive', `Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`);
//         };
//     }
//
// }
