"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const parser_1 = require("./parser");
const semver = require("semver");
Promise.longStackTraces(); // for debugging
function getLibraryPath() {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${parser_1.parseFilepath(p)}\"`; }).join(', ');
}
const sendRequest = (highlightingLevel, interaction) => (socket) => {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let request;
    if (typeof interaction === 'string') {
        request = `IOTCM \"${socket.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`;
    }
    else {
        request = `IOTCM \"${socket.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction(socket)} )\n`;
    }
    // pushing the unfullfilled request to the back of the backlog queue of Connection
    const promise = new Promise((resolve, reject) => {
        socket.queue.unshift({ resolve, reject });
    });
    // send it out
    socket.stream.write(request);
    return promise;
};
// REQUESTS
// data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
// data HighlightingLevel = None | NonInteractive | Interactive
// data HighlightingMethod = Direct | Indirect
//
// data Range a = Range [Interval' a]
// data Interval a = Interval { iStart, iEnd :: !(Position' a) }
// data Position a = Pn a !Int32 !Int32 !Int32
function buildRange(socket, goal) {
    const start = goal.range.start;
    const startIndex = goal.rangeIndex.start;
    const end = goal.range.end;
    const endIndex = goal.rangeIndex.end;
    if (semver.gte(socket.agda.version.sem, '2.5.1')) {
        return `(intervalsToRange (Just (mkAbsolute \"${socket.filepath}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
    }
    else {
        return `(Range [Interval (Pn (Just (mkAbsolute \"${socket.filepath}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${socket.filepath}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
    }
}
exports.load = sendRequest('NonInteractive', (socket) => {
    // if version > 2.5, ignore library path configuration
    if (semver.gte(socket.agda.version.sem, '2.5.0'))
        return `Cmd_load \"${socket.filepath}\" []`;
    else
        return `Cmd_load \"${socket.filepath}\" [${getLibraryPath()}]`;
});
exports.abort = sendRequest('NonInteractive', 'Cmd_abort');
exports.compile = sendRequest('NonInteractive', (socket) => {
    const backend = atom.config.get('agda-mode.backend');
    if (semver.gte(socket.agda.version.sem, '2.5.0'))
        return `Cmd_compile ${backend} \"${socket.filepath}\" []`;
    else
        return `Cmd_compile ${backend} \"${socket.filepath}\" [${getLibraryPath()}]`;
});
exports.toggleDisplayOfImplicitArguments = sendRequest('NonInteractive', 'ToggleImplicitArgs');
exports.solveConstraints = (normalization) => sendRequest('NonInteractive', `Cmd_solveAll ${normalization}`);
exports.showConstraints = sendRequest('NonInteractive', 'Cmd_constraints');
exports.showGoals = sendRequest('NonInteractive', 'Cmd_metas');
exports.whyInScope = (expr, goal) => sendRequest('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
exports.whyInScopeGlobal = (expr) => sendRequest('None', `Cmd_why_in_scope_toplevel \"${expr}\"`);
exports.inferType = (normalization, expr, goal) => sendRequest('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
exports.inferTypeGlobal = (normalization, expr) => sendRequest('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
exports.moduleContents = (normalization, expr, goal) => sendRequest('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
exports.moduleContentsGlobal = (normalization, expr) => sendRequest('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
exports.computeNormalForm = (computeMode, expr, goal) => sendRequest('NonInteractive', conn => {
    if (semver.gte(conn.agda.version.sem, '2.5.2')) {
        return `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`;
    }
    else {
        const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
        return `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`;
    }
});
exports.computeNormalFormGlobal = (computeMode, expr) => sendRequest('None', conn => {
    if (semver.gte(conn.agda.version.sem, '2.5.2')) {
        return `Cmd_compute_toplevel ${computeMode} \"${expr}\"`;
    }
    else {
        const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
        return `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`;
    }
});
// Related issue and commit of agda/agda
// https://github.com/agda/agda/issues/2730
// https://github.com/agda/agda/commit/021e6d24f47bac462d8bc88e2ea685d6156197c4
exports.give = (goal) => sendRequest('NonInteractive', conn => {
    if (semver.gte(conn.agda.version.sem, '2.5.3')) {
        return `Cmd_give WithoutForce ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`;
    }
    else {
        return `Cmd_give ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`;
    }
});
exports.refine = (goal) => sendRequest('NonInteractive', conn => (`Cmd_refine_or_intro False ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.auto = (goal) => sendRequest('NonInteractive', conn => (`Cmd_auto ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.makeCase = (goal) => sendRequest('NonInteractive', conn => (`Cmd_make_case ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.goalType = (normalization, goal) => sendRequest('NonInteractive', conn => (`Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`));
exports.context = (normalization, goal) => sendRequest('NonInteractive', conn => (`Cmd_context ${normalization} ${goal.index} noRange \"\"`));
exports.goalTypeAndContext = (normalization, goal) => sendRequest('NonInteractive', conn => (`Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`));
exports.goalTypeAndInferredType = (normalization, goal) => sendRequest('NonInteractive', conn => (`Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`));
//# sourceMappingURL=request.js.map