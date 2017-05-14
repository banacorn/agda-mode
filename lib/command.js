"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
// import * as _ from 'lodash';
// import { spawn, exec, ChildProcess } from 'child_process';
const parser_1 = require("./parser");
// import Core from './core';
// import * as Action from './view/actions';
var semver = require('semver');
Promise.longStackTraces(); // for debugging
function sendCommand(filepath, conn, highlightingLevel, interaction) {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let command;
    if (typeof interaction === 'string') {
        command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`;
    }
    else {
        command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction()} )\n`;
    }
    conn.stream.write(command);
}
function getLibraryPath() {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${parser_1.parseFilepath(p)}\"`; }).join(', ');
}
exports.load = (filepath) => (conn) => {
    // if version > 2.5, ignore library path configuration
    sendCommand(filepath, conn, 'NonInteractive', () => {
        if (semver.gte(conn.version.sem, '2.5.0'))
            return `Cmd_load \"${filepath}\" []`;
        else
            return `Cmd_load \"${filepath}\" [${getLibraryPath()}]`;
    });
};
exports.compile = (filepath) => (conn) => {
    const backend = atom.config.get('agda-mode.backend');
    sendCommand(filepath, conn, 'NonInteractive', () => {
        if (semver.gte(conn.version.sem, '2.5.0'))
            return `Cmd_load ${backend} \"${filepath}\" []`;
        else
            return `Cmd_load ${backend} \"${filepath}\" [${getLibraryPath()}]`;
    });
};
exports.toggleDisplayOfImplicitArguments = (filepath) => (conn) => {
    sendCommand(filepath, conn, 'NonInteractive', 'ToggleImplicitArgs');
};
//     toggleDisplayOfImplicitArguments = (): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', 'ToggleImplicitArgs');
//     }
//
//     solveConstraints = (): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', 'Cmd_solveAll');
//     }
//
//     showConstraints = (): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', 'Cmd_constraints');
//     }
//
//     showGoals = (): Promise<ChildProcess> => {
//         return this.sendCommand('NonInteractive', 'Cmd_metas');
//     }
//
//     whyInScope = (expr: string, goal?: Goal): Promise<ChildProcess> => {
//         if (goal) {
//             return this.sendCommand('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
//         } else {
//             return this.sendCommand('None', `Cmd_why_in_scope_toplevel \"${expr}\"`);
//         }
//     }
//
//
//     inferType = (normalization: Normalization, goal?: Goal): (expr: string) => Promise<ChildProcess> => {
//         return (expr) => {
//             if (goal) {
//                 return this.sendCommand('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
//             } else {
//                 return this.sendCommand('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
//             }
//         }
//     }
//
//     moduleContents = (normalization: Normalization, expr: string): (goal?: Goal) => Promise<ChildProcess> => {
//         return (goal) => {
//             if (goal) {
//                 return this.sendCommand('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
//             } else {
//                 return this.sendCommand('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
//             }
//         }
//     }
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
//# sourceMappingURL=command.js.map