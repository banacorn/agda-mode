"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const util_1 = require("./parser/util");
const semver = require("semver");
Promise.longStackTraces(); // for debugging
function getLibraryPath() {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${util_1.parseFilepath(p)}\"`; }).join(', ');
}
const buildRequest = (highlightingLevel, interaction) => (header, connection) => {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let body;
    if (typeof interaction === 'string') {
        body = `IOTCM \"${connection.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`;
    }
    else { // interaction is a callback
        body = `IOTCM \"${connection.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction(connection)} )\n`;
    }
    return { header, body, connection };
};
// REQUESTS
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
        return `(Range [Interval (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
    }
}
exports.load = buildRequest('NonInteractive', (conn) => {
    // if version > 2.5, ignore library path configuration
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_load \"${conn.filepath}\" []`;
    else
        return `Cmd_load \"${conn.filepath}\" [${getLibraryPath()}]`;
});
exports.abort = buildRequest('NonInteractive', 'Cmd_abort');
exports.compile = buildRequest('NonInteractive', (conn) => {
    const backend = atom.config.get('agda-mode.backend');
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_compile ${backend} \"${conn.filepath}\" []`;
    else
        return `Cmd_compile ${backend} \"${conn.filepath}\" [${getLibraryPath()}]`;
});
exports.toggleDisplayOfImplicitArguments = buildRequest('NonInteractive', 'ToggleImplicitArgs');
exports.solveConstraints = (normalization) => buildRequest('NonInteractive', `Cmd_solveAll ${normalization}`);
exports.showConstraints = buildRequest('NonInteractive', 'Cmd_constraints');
exports.showGoals = buildRequest('NonInteractive', 'Cmd_metas');
exports.searchAbout = (normalization, expr) => buildRequest('None', `Cmd_search_about_toplevel ${normalization} \"${expr}\"`);
exports.whyInScope = (expr, goal) => buildRequest('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${util_1.parseUserInput(expr)}\"`);
exports.whyInScopeGlobal = (expr) => buildRequest('None', `Cmd_why_in_scope_toplevel \"${util_1.parseUserInput(expr)}\"`);
exports.inferType = (normalization, expr, goal) => buildRequest('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
exports.inferTypeGlobal = (normalization, expr) => buildRequest('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
exports.moduleContents = (normalization, expr, goal) => buildRequest('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
exports.moduleContentsGlobal = (normalization, expr) => buildRequest('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
exports.computeNormalForm = (computeMode, expr, goal) => buildRequest('NonInteractive', conn => {
    if (semver.gte(conn.version.sem, '2.5.2')) {
        return `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`;
    }
    else {
        const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
        return `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`;
    }
});
exports.computeNormalFormGlobal = (computeMode, expr) => buildRequest('None', conn => {
    if (semver.gte(conn.version.sem, '2.5.2')) {
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
exports.give = (goal) => buildRequest('NonInteractive', conn => {
    if (semver.gte(conn.version.sem, '2.5.3')) {
        return `Cmd_give WithoutForce ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`;
    }
    else {
        return `Cmd_give ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`;
    }
});
exports.refine = (goal) => buildRequest('NonInteractive', conn => (`Cmd_refine_or_intro False ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.auto = (goal) => buildRequest('NonInteractive', conn => (`Cmd_auto ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.makeCase = (goal) => buildRequest('NonInteractive', conn => (`Cmd_make_case ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`));
exports.goalType = (normalization, goal) => buildRequest('NonInteractive', () => (`Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`));
exports.context = (normalization, goal) => buildRequest('NonInteractive', () => (`Cmd_context ${normalization} ${goal.index} noRange \"\"`));
exports.goalTypeAndContext = (normalization, goal) => buildRequest('NonInteractive', () => (`Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`));
exports.goalTypeAndInferredType = (normalization, goal) => buildRequest('NonInteractive', () => (`Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`));
exports.gotoDefinition = (expr, goal) => buildRequest('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
exports.gotoDefinitionGlobal = (expr) => buildRequest('None', `Cmd_why_in_scope_toplevel \"${util_1.parseUserInput(expr)}\"`);
//# sourceMappingURL=request.js.map