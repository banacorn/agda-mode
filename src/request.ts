import * as Promise from 'bluebird';
import { parseFilepath } from './parser';
import { Agda, Connection, Goal } from './type';
import * as semver from 'semver';

declare var atom: any;

Promise.longStackTraces();  // for debugging

function getLibraryPath(): string {
    const path = atom.config.get('agda-mode.libraryPath');
    path.unshift('.');
    return path.map((p) => { return `\"${ parseFilepath(p) }\"`; }).join(', ');
}

const sendRequest = (highlightingLevel: string, interaction: string | ((conn: Connection) => string)) => (conn: Connection): Promise<Agda.Action[]> => {
    const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
    let reqeust: string;
    if (typeof interaction === 'string') {
        reqeust = `IOTCM \"${conn.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`
    } else {    // interaction is a callback
        reqeust = `IOTCM \"${conn.filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction(conn)} )\n`;
    }
    // pushing the unfullfilled request to the back of the backlog queue of Connection
    const promise = new Promise<Agda.Action[]>((resolve, reject) => {
        conn.queue.unshift({ resolve, reject });
    });
    // send it out
    conn.stream.write(reqeust);

    return promise;
}


// REQUESTS

// data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
// data HighlightingLevel = None | NonInteractive | Interactive
// data HighlightingMethod = Direct | Indirect
//
// data Range a = Range [Interval' a]
// data Interval a = Interval { iStart, iEnd :: !(Position' a) }
// data Position a = Pn a !Int32 !Int32 !Int32

function buildRange(conn: Connection, goal: Goal): string {
    const start       = goal.range.start;
    const startIndex  = goal.rangeIndex.start;
    const end         = goal.range.end;
    const endIndex    = goal.rangeIndex.end;
    if (semver.gte(conn.agda.version.sem, '2.5.1')) {
        return `(intervalsToRange (Just (mkAbsolute \"${conn.filepath}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
    } else {
        return `(Range [Interval (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${conn.filepath}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
    }
}


export const load = sendRequest('NonInteractive', (conn) => {
    // if version > 2.5, ignore library path configuration
    if (semver.gte(conn.agda.version.sem, '2.5.0'))
        return `Cmd_load \"${conn.filepath}\" []`
    else
        return `Cmd_load \"${conn.filepath}\" [${getLibraryPath()}]`
});

export const compile = sendRequest('NonInteractive', (conn) => {
    const backend = atom.config.get('agda-mode.backend');
    if (semver.gte(conn.agda.version.sem, '2.5.0'))
        return `Cmd_compile ${backend} \"${conn.filepath}\" []`
    else
        return `Cmd_compile ${backend} \"${conn.filepath}\" [${getLibraryPath()}]`
});

export const toggleDisplayOfImplicitArguments =
    sendRequest('NonInteractive', 'ToggleImplicitArgs');

export const solveConstraints = (normalization: Agda.Normalization) =>
    sendRequest('NonInteractive', `Cmd_solveAll ${normalization}`);

export const showConstraints =
    sendRequest('NonInteractive', 'Cmd_constraints');

export const showGoals =
    sendRequest('NonInteractive', 'Cmd_metas');

export const whyInScope = (expr: string, goal: Goal) =>
    sendRequest('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);

export const whyInScopeGlobal = (expr: string) =>
    sendRequest('None', `Cmd_why_in_scope_toplevel \"${expr}\"`)

export const inferType = (normalization: Agda.Normalization, expr: string, goal: Goal) =>
    sendRequest('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);

export const inferTypeGlobal = (normalization: Agda.Normalization, expr: string) =>
    sendRequest('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);

export const moduleContents = (normalization: Agda.Normalization, expr: string, goal: Goal) =>
    sendRequest('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
export const moduleContentsGlobal = (normalization: Agda.Normalization, expr: string) =>
    sendRequest('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);

export const computeNormalForm = (computeMode: Agda.ComputeMode, expr: string, goal: Goal) =>
    sendRequest('NonInteractive', conn => {
        if (semver.gte(conn.agda.version.sem, '2.5.2')) {
            return `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`;
        } else {
            const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
            return `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`
        }
    });

export const computeNormalFormGlobal = (computeMode: Agda.ComputeMode, expr: string) =>
    sendRequest('None', conn => {
        if (semver.gte(conn.agda.version.sem, '2.5.2')) {
            return `Cmd_compute_toplevel ${computeMode} \"${expr}\"`;
        } else {
            const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
            return `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`
        }
    });

export const give = (goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_give ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const refine = (goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_refine_or_intro False ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const auto = (goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_auto ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const makeCase = (goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_make_case ${goal.index} ${buildRange(conn, goal)} \"${goal.getContent()}\"`)
);

export const goalType = (normalization: Agda.Normalization, goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`)
);

export const context = (normalization: Agda.Normalization, goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_context ${normalization} ${goal.index} noRange \"\"`)
);

export const goalTypeAndContext = (normalization: Agda.Normalization, goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`)
);

export const goalTypeAndInferredType = (normalization: Agda.Normalization, goal: Goal) => sendRequest('NonInteractive', conn =>
    (`Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`)
);
