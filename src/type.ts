import * as Promise from 'bluebird';
import { EventEmitter } from 'events';
import { ParsedPath } from 'path';
import { Duplex } from 'stream';
import { AgdaError } from './parser/error';

import { Range } from 'atom';
import * as Atom from 'atom';

export type TextInput = string;

const enum FileType {
    Agda,
    LiterateTeX,
    LiterateReStructuredText,
    LiterateMarkdown
}

interface IndexRange {
    start: number,
    end: number
}

interface Token {
    content: string,
    range: IndexRange,
    type: TokenType
}

const enum TokenType {
    AgdaRaw,
    Literate,
    Comment,
    GoalBracket,
    GoalQMRaw, // ? + ?
    GoalQM // ?
}

interface Hole {
    index: number,
    modifiedRange: IndexRange,
    originalRange: IndexRange,
    content: string
}

export interface Parsed<T> {
    raw: string;
    parsed: T
}

//
//  View
//

namespace View {

    export interface State {
        view: ViewState;
        mode: Mode;
        connection: ConnectionState;
        protocol: Protocol;
        header: HeaderState;
        inputMethod: InputMethodState;
        query: QueryState;
        body: BodyState;
    }

    export interface ViewState {
        activated: boolean;
        mounted: boolean;
        mountAt: {
            previous: MountingPosition,
            current: MountingPosition
        };
        settingsView: boolean;
        settingsURI: SettingsURI;
    }

    export const enum Mode {
        Display,
        Query,
        QueryConnection
    }

    export interface ConnectionState {
        querying: boolean; // is agda-mode querying for the path to Agda?
        agda?: ValidPath;
        agdaMessage: string;
        languageServerEnabled: boolean;
        languageServer?: ValidPath;
        languageServerMessage: string;
    }

    export interface Protocol {
        log: ReqRes[];
        id: number;// for indexing ReqRes

        pending: boolean;
        lsp: boolean;

        limitLog: boolean;
    }

    // a request-response pair
    export interface ReqRes {
        id: number;
        request: Parsed<Agda.Request>;
        responses: Parsed<Agda.Response>[];
    }


    export const enum MountingPosition {
        Pane,
        Bottom
    }

    export interface InputMethodState {
        activated: boolean;
        buffer: string;
        translation: string;
        further: boolean;
        keySuggestions: string[];
        candidateSymbols: string[];
    }

    export const enum Style {
        PlainText,
        Info,
        Success,
        Error,
        Warning
    }

    export interface HeaderState {
        text: string;
        style: Style;
    }

    export interface QueryState {
        placeholder: string;
        value: string;
    }

    export interface BodyState {
        body: Body;
        error: AgdaError;
        plainText: string;
        solutions: Solutions;
        maxBodyHeight: number;
    }

    export type SettingsURI = {
        path: '/' | '/Connection' | '/Protocol';
        param?: number;
    };

    ////////////////////////////////////////////
    // Solutions
    ////////////////////////////////////////////

    export type Solutions = SimpleSolutions | IndexedSolutions;
    export type SimpleSolutions = {
        kind: 'SimpleSolutions';
        message: string,
        solutions: {
            index: number;
            expr: string;
        }[];
    }
    export type IndexedSolutions = {
        kind: 'IndexedSolutions';
        message: string,
        solutions: {
            index: number;
            combination: {
                goalIndex: number;
                expr: string;
            }[];
        }[];
    }

    ////////////////////////////////////////////
    // Expressions components
    ////////////////////////////////////////////

    export type Expr = Goal | Judgement | Term | Meta | Sort;
    export type ExprKind = 'goal' |
        'type judgement' |
        'meta' |
        'term' |
        'sort' ;

    export interface Goal {
        judgementForm: ExprKind,
        type: string;
        index: string;
    }

    export interface Judgement {
        judgementForm: ExprKind,
        type: string;
        expr: string;
        index?: string;
    }

    export interface Term {
        judgementForm: ExprKind;
        expr: string;
    }

    export interface Meta {
        judgementForm: ExprKind;
        type: string;
        location: Location;
        index: string;
    }

    export interface Sort {
        judgementForm: ExprKind;
        location: Location;
        index: string;
    }


    ////////////////////////////////////////////
    // Body components
    ////////////////////////////////////////////

    export interface Body {
        goalAndHave: GoalAndHave[];
        // ------
        goals: Goal[];
        judgements: Judgement[];
        terms: Term[];
        metas: Meta[];
        sorts: Sort[];
        // --------
        warnings: string[];
        // --------
        errors: string[];
    }

    export interface GoalAndHave {
        type: string;
        label: string;
    }
}

namespace Agda {
    //
    //  Commands sent to Agda
    //
    export type CommandKind = 'Load' | 'Quit' | 'Restart' | 'Abort' | 'Compile' |
        'ToggleDisplayOfImplicitArguments' | 'ShowConstraints' |
        'SolveConstraints' | 'ShowGoals' | 'NextGoal' | 'PreviousGoal' |
        'ToggleDocking' |
        'WhyInScope' | 'InferType' | 'ModuleContents' | 'ComputeNormalForm' |
        'Give' | 'Refine' | 'Auto' | 'Case' |
        'GoalType' | 'Context' | 'GoalTypeAndContext' | 'GoalTypeAndInferredType' |
        'InputSymbol' | 'InputSymbolCurlyBracket' | 'InputSymbolBracket'
        | 'InputSymbolParenthesis' | 'InputSymbolDoubleQuote' | 'InputSymbolSingleQuote'
        | 'InputSymbolBackQuote' | 'QuerySymbol';

    export type Normalization = 'Simplified' | 'Instantiated' | 'Normalised';
    export type ComputeMode = 'DefaultCompute' | 'IgnoreAbstract' | 'UseShowInstance';

    export type Command = {
        kind: CommandKind,
        normalization?: Normalization,
        computeMode?: ComputeMode,
    };

    //
    //  Request to Agda
    //
    export type Request = {
        header: Command;
        body?: string;
        connection?: Connection;
    };
    //
    //  Response from Agda
    //
    export type Response =
        // Resp_HighlightingInfo
        HighlightingInfo_Direct |
        HighlightingInfo_Indirect |
        // Resp_Status
        Status |
        // Resp_JumpToError
        JumpToError |
        // Resp_InteractionPoints
        InteractionPoints |
        // Resp_GiveAction
        GiveAction |
        // Resp_MakeCase
        MakeCase |
        // Resp_SolveAll
        SolveAll |
        // Resp_DisplayInfo
        DisplayInfo |

        // Never tested
        // Resp_RunningInfo Int String
        RunningInfo |
        // Resp_ClearRunningInfo
        ClearRunningInfo |

        // Resp_ClearHighlighting
        ClearHighlighting |
        // Resp_DoneAborting
        DoneAborting;


    // Resp_HighlightingInfo HighlightingInfo HighlightingMethod ModuleToSource
    export interface HighlightingInfo_Direct {
        kind: 'HighlightingInfo_Direct';
        annotations: Annotation[];
    }

    export interface HighlightingInfo_Indirect {
        kind: 'HighlightingInfo_Indirect';
        filepath: string;
    }

    export interface Annotation {
        start: string,
        end: string,
        type: string[]
        source?: {
            filepath: string,
            index: string
        }
    }

    // Resp_Status Status
    export interface Status {
        kind: 'Status';
        // Are implicit arguments displayed?
        showImplicit: boolean;
        // Has the module been successfully type checked?
        checked: boolean;
    }

    // Resp_JumpToError FilePath Int32
    export interface JumpToError {
        kind: 'JumpToError';
        filepath: string;
        position: number;
    }

    // Resp_InteractionPoints [InteractionId]
    export interface InteractionPoints {
        kind: 'InteractionPoints';
        fileType: FileType; // Issue #56
        indices: number[];
    }

    // Resp_GiveAction InteractionId GiveResult
    export interface GiveAction {
        kind: 'GiveAction';
        index: number;
        giveResult: 'Paren' | 'NoParen' | 'String';
        result: string;
    }

    // Resp_MakeCase MakeCaseVariant [String]
    export interface MakeCase {
        kind: 'MakeCase';
        variant: 'Function' | 'ExtendedLambda';
        result: string[];
    }

    // Resp_SolveAll  [(InteractionId, Expr)]
    export interface SolveAll {
        kind: 'SolveAll';
        solutions: {
            index: number,
            expression: string
        }[];
    }

    // Resp_DisplayInfo DisplayInfo
    export type DisplayInfoKind = 'CompilationOk' | 'Constraints' |
        'AllGoals' | 'Auto' | 'Error' | 'Time' | 'NormalForm' |
        'InferredType' | 'CurrentGoal' | 'GoalType' | 'ModuleContents' |
        'SearchAbout' | 'WhyInScope' | 'Context' | 'HelperFunction' | 'Intro' |
        'Version' | 'AllWarnings' | 'AllErrors';
    export interface DisplayInfo {
        kind: 'DisplayInfo';
        displayInfoKind: DisplayInfoKind;
        title: string;
        content: string[];
        append: boolean;
    }

    // Resp_RunningInfo Int String
    export interface RunningInfo {
        kind: 'RunningInfo';
        verbosity: number;
        message: string;
    }

    // Resp_ClearRunningInfo
    export interface ClearRunningInfo {
        kind: 'ClearRunningInfo';
    }

    // Resp_ClearHighlighting
    export interface ClearHighlighting {
        kind: 'HighlightClear';
    }

    // Resp_DoneAborting
    export interface DoneAborting {
        kind: 'DoneAborting';
    }
}

// Occurence & Location
export interface Occurence {
    location: Location,
    body: string
}

export interface Location {
    path: string,
    range: Atom.Range,
    isSameLine: boolean
}


// type Suggestion = string[];

//
// Connection
//

export type Path = string;
export type Version = {
    raw: string;
    sem: string;
};
export type ValidPath = {
    path: Path;
    version: Version
};

export type Connection = ValidPath & {
    stream: Duplex;
    queue: {
        resolve: (actions: Agda.Response[]) => void;
        reject: (error?: any) => void;
    }[];
    filepath: string;   // path of the Agda file
}

export {
    Agda,
    Hole,
    FileType,
    Token,
    TokenType,
    View
}
