import { Conn } from '../type';

import * as Syntax from './agda/syntax';
export { Syntax as Syntax };
import * as TypeChecking from './agda/typeChecking';
export { TypeChecking as TypeChecking };


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
    | 'InputSymbolBackQuote' | 'QuerySymbol' | 'GotoDefinition';

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
    connection?: Conn.Connection;
};
//
//  Response from Agda
//
export type Response =
    // Resp_HighlightingInfo
    HighlightingInfo_Direct |
    HighlightingInfo_Indirect |

    DisplayInfo                 |
    ClearHighlighting           |
    DoneAborting                |
    ClearRunningInfo            |
    RunningInfo                 |
    Status                      |
    JumpToError                 |
    InteractionPoints           |
    GiveAction                  |
    MakeCase                    |
    SolveAll                    ;

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

export interface WhyInScope {
    range: Syntax.Position.Range
}

// Resp_Status Status
export interface Status {
    kind: 'Status';
    // Are implicit arguments displayed?
    showImplicitArguments: boolean;
    // Has the module been successfully type checked?
    checked: boolean;
}

// Resp_JumpToError FilePath Int32
export interface JumpToError {
    kind: 'JumpToError';
    filepath: string;
    position: number;
}

export const enum FileType {
    Agda,
    LiterateTeX,
    LiterateReStructuredText,
    LiterateMarkdown
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

export interface DisplayInfo {
    kind: 'DisplayInfo';
    info: Info
}
//
//  Response from Agda
//
export type Info =
    Info_CompilationOk |
    Info_Constraints |
    Info_AllGoalsWarnings |
    Info_Time | Info_Error | Info_Intro | Info_Auto | Info_ModuleContents |
    Info_SearchAbout | Info_WhyInScope | Info_NormalForm | Info_GoalType |
    Info_CurrentGoal | Info_InferredType | Info_Context |
    Info_HelperFunction | Info_Version;

export interface Info_CompilationOk {
    kind: "CompilationOk";
    warnings: string;
    errors: string;
    emacsMessage: string;    // for Emacs
}

export interface Info_Constraints {
    kind: "Constraints";
    constraints: string;
}

export interface Info_AllGoalsWarnings {
    kind: "AllGoalsWarnings",
    goals: string;
    warnings: string;
    errors: string;
    emacsMessage: string;    // for Emacs
}
export interface Info_Error {
    kind: "Error";
    error: Error;
    emacsMessage: string;
}
export interface Info_Time { kind: "Time"; payload: string }
export interface Info_Intro { kind: "Intro"; payload: string }
export interface Info_Auto { kind: "Auto"; payload: string }
export interface Info_ModuleContents { kind: "ModuleContents"; payload: string }
export interface Info_SearchAbout { kind: "SearchAbout"; payload: string }
export interface Info_WhyInScope { kind: "WhyInScope"; payload: string }
export interface Info_NormalForm { kind: "NormalForm"; payload: string }
export interface Info_GoalType { kind: "GoalType"; payload: string }
export interface Info_CurrentGoal { kind: "CurrentGoal"; payload: string }
export interface Info_InferredType { kind: "InferredType"; payload: string }
export interface Info_Context { kind: "Context"; payload: string }
export interface Info_HelperFunction { kind: "HelperFunction"; payload: string }
export interface Info_Version { kind: "Version"; version: string }

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
