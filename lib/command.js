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
function getLibraryPath() {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${parser_1.parseFilepath(p)}\"`; }).join(', ');
}
const sendCommand = (highlightingLevel, interaction) => (conn) => {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let command;
    if (typeof interaction === 'string') {
        command = `IOTCM \"${conn.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`;
    }
    else {
        command = `IOTCM \"${conn.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction(conn)} )\n`;
    }
    conn.stream.write(command);
    console.log(command);
    return Promise.resolve({});
};
// COMMANDS
// data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
// data HighlightingLevel = None | NonInteractive | Interactive
// data HighlightingMethod = Direct | Indirect
//
// data Range a = Range [Interval' a]
// data Interval a = Interval { iStart, iEnd :: !(Position' a) }
// data Position a = Pn a !Int32 !Int32 !Int32
function buildRange(conn, goal) {
    const start = goal.range.start;
    const startIndex = goal.rangeIndex.start;
    const end = goal.range.end;
    const endIndex = goal.rangeIndex.end;
    if (semver.gte(conn.version.sem, '2.5.1')) {
        return `(intervalsToRange (Just (mkAbsolute \"${conn.filepath}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
    }
    else {
        return `(Range [Interval (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
    }
}
exports.load = sendCommand('NonInteractive', (conn) => {
    // if version > 2.5, ignore library path configuration
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_load \"${conn.filepath}\" []`;
    else
        return `Cmd_load \"${conn.filepath}\" [${getLibraryPath()}]`;
});
exports.compile = sendCommand('NonInteractive', (conn) => {
    const backend = atom.config.get('agda-mode.backend');
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_compile ${backend} \"${conn.filepath}\" []`;
    else
        return `Cmd_compile ${backend} \"${conn.filepath}\" [${getLibraryPath()}]`;
});
exports.toggleDisplayOfImplicitArguments = sendCommand('NonInteractive', 'ToggleImplicitArgs');
exports.solveConstraints = sendCommand('NonInteractive', 'Cmd_solveAll');
exports.showConstraints = sendCommand('NonInteractive', 'Cmd_constraints');
exports.showGoals = sendCommand('NonInteractive', 'Cmd_metas');
exports.whyInScope = (expr, goal) => sendCommand('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
exports.whyInScopeGlobal = (expr) => sendCommand('None', `Cmd_why_in_scope_toplevel \"${expr}\"`);
exports.inferType = (normalization, expr, goal) => sendCommand('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
exports.inferTypeGlobal = (normalization, expr) => sendCommand('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
exports.moduleContents = (normalization, expr, goal) => sendCommand('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
exports.moduleContentsGlobal = (normalization, expr) => sendCommand('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
exports.computeNormalForm = (computeMode, expr, goal) => sendCommand('NonInteractive', conn => {
    if (semver.gte(conn.version.sem, '2.5.2')) {
        return `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`;
    }
    else {
        const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
        return `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`;
    }
});
exports.computeNormalFormGlobal = (computeMode, expr) => sendCommand('None', conn => {
    if (semver.gte(conn.version.sem, '2.5.2')) {
        return `Cmd_compute_toplevel ${computeMode} \"${expr}\"`;
    }
    else {
        const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
        return `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`;
    }
});
exports.give = (goal) => sendCommand('NonInteractive', conn => (`Cmd_give ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.refine = (goal) => sendCommand('NonInteractive', conn => (`Cmd_refine_or_intro False ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.auto = (goal) => sendCommand('NonInteractive', conn => (`Cmd_auto ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.makeCase = (goal) => sendCommand('NonInteractive', conn => (`Cmd_make_case ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.goalType = (normalization, goal) => sendCommand('NonInteractive', conn => (`Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`));
exports.context = (normalization, goal) => sendCommand('NonInteractive', conn => (`Cmd_context ${normalization} ${goal.index} noRange \"\"`));
exports.goalTypeAndContext = (normalization, goal) => sendCommand('NonInteractive', conn => (`Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`));
exports.goalTypeAndInferredType = (normalization, goal) => sendCommand('NonInteractive', conn => (`Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`));
//# sourceMappingURL=command.js.map