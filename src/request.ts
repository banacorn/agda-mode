import * as Promise from 'bluebird';
import { parseFilepath, parseInputContent } from './parser/util';
import { Agda, Conn } from './type';
import * as semver from 'semver';
import Goal from './editor/goal';

Promise.longStackTraces();  // for debugging

function getLibraryPath(): string {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${ parseFilepath(p) }\"`; }).join(', ');
}

const buildRequest = (highlightingLevel: string, interaction: string | ((conn: Conn.Connection) => string)) => (header: Agda.Command, connection: Conn.Connection): Agda.Request => {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let body: string;
    if (typeof interaction === 'string') {
        body = `IOTCM \"${connection.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`
    } else {    // interaction is a callback
        body = `IOTCM \"${connection.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction(connection)} )\n`;
    }
    return { header, body, connection };
}

// REQUESTS

// data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
// data HighlightingLevel = None | NonInteractive | Interactive
// data HighlightingMethod = Direct | Indirect
//
// data Range a = Range [Interval' a]
// data Interval a = Interval { iStart, iEnd :: !(Position' a) }
// data Position a = Pn a !Int32 !Int32 !Int32

function buildRange(conn: Conn.Connection, goal: Goal): string {
    const start       = goal.range.start;
    const startIndex  = goal.rangeIndex.start;
    const end         = goal.range.end;
    const endIndex    = goal.rangeIndex.end;
    if (semver.gte(conn.version.sem, '2.5.1')) {
        return `(intervalsToRange (Just (mkAbsolute \"${conn.filepath}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
    } else {
        return `(Range [Interval (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
    }
}


export const load = buildRequest('NonInteractive', (conn) => {
    // if version > 2.5, ignore library path configuration
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_load \"${conn.filepath}\" []`
    else
        return `Cmd_load \"${conn.filepath}\" [${getLibraryPath()}]`
});

export const abort = buildRequest('NonInteractive', 'Cmd_abort');

export const compile = buildRequest('NonInteractive', (conn) => {
    const backend = atom.config.get('agda-mode.backend');
    if (semver.gte(conn.version.sem, '2.5.0'))
        return `Cmd_compile ${backend} \"${conn.filepath}\" []`
    else
        return `Cmd_compile ${backend} \"${conn.filepath}\" [${getLibraryPath()}]`
});

export const toggleDisplayOfImplicitArguments =
    buildRequest('NonInteractive', 'ToggleImplicitArgs');

export const solveConstraints = (normalization: Agda.Normalization) =>
    buildRequest('NonInteractive', `Cmd_solveAll ${normalization}`);

export const showConstraints =
    buildRequest('NonInteractive', 'Cmd_constraints');

export const showGoals =
    buildRequest('NonInteractive', 'Cmd_metas');

export const whyInScope = (expr: string, goal: Goal) =>
    buildRequest('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${parseInputContent(expr)}\"`);

export const whyInScopeGlobal = (expr: string) =>
    buildRequest('None', `Cmd_why_in_scope_toplevel \"${parseInputContent(expr)}\"`)

export const inferType = (normalization: Agda.Normalization, expr: string, goal: Goal) =>
    buildRequest('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);

export const inferTypeGlobal = (normalization: Agda.Normalization, expr: string) =>
    buildRequest('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);

export const moduleContents = (normalization: Agda.Normalization, expr: string, goal: Goal) =>
    buildRequest('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
export const moduleContentsGlobal = (normalization: Agda.Normalization, expr: string) =>
    buildRequest('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);

export const computeNormalForm = (computeMode: Agda.ComputeMode, expr: string, goal: Goal) =>
    buildRequest('NonInteractive', conn => {
        if (semver.gte(conn.version.sem, '2.5.2')) {
            return `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`;
        } else {
            const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
            return `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`
        }
    });

export const computeNormalFormGlobal = (computeMode: Agda.ComputeMode, expr: string) =>
    buildRequest('None', conn => {
        if (semver.gte(conn.version.sem, '2.5.2')) {
            return `Cmd_compute_toplevel ${computeMode} \"${expr}\"`;
        } else {
            const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
            return `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`
        }
    });

// Related issue and commit of agda/agda
// https://github.com/agda/agda/issues/2730
// https://github.com/agda/agda/commit/021e6d24f47bac462d8bc88e2ea685d6156197c4
export const give = (goal: Goal) => buildRequest('NonInteractive', conn =>{
    if (semver.gte(conn.version.sem, '2.5.3')) {
        return `Cmd_give WithoutForce ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`;
    } else {
        return `Cmd_give ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`;
    }
});

export const refine = (goal: Goal) => buildRequest('NonInteractive', conn =>
    (`Cmd_refine_or_intro False ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const auto = (goal: Goal) => buildRequest('NonInteractive', conn =>
    (`Cmd_auto ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const makeCase = (goal: Goal) => buildRequest('NonInteractive', conn =>
    (`Cmd_make_case ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const goalType = (normalization: Agda.Normalization, goal: Goal) => buildRequest('NonInteractive', () =>
    (`Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`)
);

export const context = (normalization: Agda.Normalization, goal: Goal) => buildRequest('NonInteractive', () =>
    (`Cmd_context ${normalization} ${goal.index} noRange \"\"`)
);

export const goalTypeAndContext = (normalization: Agda.Normalization, goal: Goal) => buildRequest('NonInteractive', () =>
    (`Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`)
);

export const goalTypeAndInferredType = (normalization: Agda.Normalization, goal: Goal) => buildRequest('NonInteractive', () =>
    (`Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`)
);

export const gotoDefinition = (expr: string, goal: Goal) =>
    buildRequest('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);

export const gotoDefinitionGlobal = (expr: string) =>
    buildRequest('None', `Cmd_why_in_scope_toplevel \"${parseInputContent(expr)}\"`)
