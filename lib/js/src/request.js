"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const util_1 = require("./parser/util");
const semver = require("semver");
// import Goal from './editor/goal';
const HoleRE = require('./Reason/Hole.bs');
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
function buildRange(conn, hole) {
    if (semver.gte(conn.version.sem, '2.5.1')) {
        return HoleRE.buildHaskellRange(false, conn.filepath, hole);
        // return `(intervalsToRange (Just (mkAbsolute \"${conn.filepath}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
    }
    else {
        return HoleRE.buildHaskellRange(true, conn.filepath, hole);
        // return `(Range [Interval (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
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
exports.whyInScope = (expr, hole) => buildRequest('NonInteractive', `Cmd_why_in_scope ${HoleRE.index(hole)} noRange \"${util_1.parseInputContent(expr)}\"`);
exports.whyInScopeGlobal = (expr) => buildRequest('None', `Cmd_why_in_scope_toplevel \"${util_1.parseInputContent(expr)}\"`);
exports.inferType = (normalization, expr, hole) => buildRequest('NonInteractive', `Cmd_infer ${normalization} ${HoleRE.index(hole)} noRange \"${expr}\"`);
exports.inferTypeGlobal = (normalization, expr) => buildRequest('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
exports.moduleContents = (normalization, expr, hole) => buildRequest('NonInteractive', `Cmd_show_module_contents ${normalization} ${HoleRE.index(hole)} noRange \"${expr}\"`);
exports.moduleContentsGlobal = (normalization, expr) => buildRequest('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
exports.computeNormalForm = (computeMode, expr, hole) => buildRequest('NonInteractive', conn => {
    if (semver.gte(conn.version.sem, '2.5.2')) {
        return `Cmd_compute ${computeMode} ${HoleRE.index(hole)} noRange \"${expr}\"`;
    }
    else {
        const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
        return `Cmd_compute ${ignoreAbstract} ${HoleRE.index(hole)} noRange \"${expr}\"`;
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
exports.give = (hole) => buildRequest('NonInteractive', conn => {
    if (semver.gte(conn.version.sem, '2.5.3')) {
        return `Cmd_give WithoutForce ${HoleRE.index(hole)} ${buildRange(conn, hole)} \"${HoleRE.getContent(hole)}\"`;
    }
    else {
        return `Cmd_give ${HoleRE.index(hole)} ${buildRange(conn, hole)} \"${HoleRE.getContent(hole)}\"`;
    }
});
exports.refine = (hole) => buildRequest('NonInteractive', conn => (`Cmd_refine_or_intro False ${HoleRE.index(hole)} ${buildRange(conn, hole)} \"${HoleRE.getContent(hole)}\"`));
exports.auto = (hole) => buildRequest('NonInteractive', conn => (`Cmd_auto ${HoleRE.index(hole)} ${buildRange(conn, hole)} \"${HoleRE.getContent(hole)}\"`));
exports.makeCase = (hole) => buildRequest('NonInteractive', conn => (`Cmd_make_case ${HoleRE.index(hole)} ${buildRange(conn, hole)} \"${HoleRE.getContent(hole)}\"`));
exports.goalType = (normalization, hole) => buildRequest('NonInteractive', () => (`Cmd_goal_type ${normalization} ${HoleRE.index(hole)} noRange \"\"`));
exports.context = (normalization, hole) => buildRequest('NonInteractive', () => (`Cmd_context ${normalization} ${HoleRE.index(hole)} noRange \"\"`));
exports.goalTypeAndContext = (normalization, hole) => buildRequest('NonInteractive', () => (`Cmd_goal_type_context ${normalization} ${HoleRE.index(hole)} noRange \"\"`));
exports.goalTypeAndInferredType = (normalization, hole) => buildRequest('NonInteractive', () => (`Cmd_goal_type_context_infer ${normalization} ${HoleRE.index(hole)} noRange \"${HoleRE.getContent(hole)}\"`));
exports.gotoDefinition = (expr, hole) => buildRequest('NonInteractive', `Cmd_why_in_scope ${HoleRE.index(hole)} noRange \"${expr}\"`);
exports.gotoDefinitionGlobal = (expr) => buildRequest('None', `Cmd_why_in_scope_toplevel \"${util_1.parseInputContent(expr)}\"`);
//# sourceMappingURL=request.js.map