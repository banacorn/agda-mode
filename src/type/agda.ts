import { Duplex } from 'stream';

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
// Connection
//

export type Path = string;
export type Version = {
    raw: string;
    sem: string;
};
export type Protocol = 'Emacs' | 'JSON';
export type ValidPath = {
    path: Path;
    version: Version;
    supportedProtocol: Protocol[];
};

export type Connection = ValidPath & {
    stream: Duplex;
    queue: {
        resolve: (actions: Response[]) => void;
        reject: (error?: any) => void;
    }[];
    filepath: string;   // path of the Agda file
}

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
    range: Syntax.Range
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


//
//  QName
//

export namespace Syntax {

    export type NameId = {
        name: String;
        module: String;
    };

    export type NamePart = null | String;

    export type Name = {
        kind: 'Name';
        range: Range;
        parts: NamePart[];
    } | {
        kind: 'NoName';
        range: Range;
        name: NameId;
    };

    export type QName = Name[];
    export type Position = [number, number, number] | [number, number];
    export type Interval = {
        start: Position;
        end  : Position;
    };

    export type Range = {
        intervals: Interval[];
        source?: string;
    };
}



//
//  Error
//

export type Error =
    Error_TypeError |
    Error_Exception |
    Error_IOException |
    Error_PatternError ;

export interface Error_TypeError {
    kind: 'TypeError';
    range: Syntax.Range;
    typeError: TypeError;
}
export interface Error_Exception {
    kind: 'Exception';
    range: Syntax.Range;
    message: String;
}
export interface Error_IOException {
    kind: 'IOException';
    range: Syntax.Range;
    message: String;
}
export interface Error_PatternError {
    kind: 'PatternError';
    range: Syntax.Range;
}

//
//  TypeError
//

export type TypeError =
    // ...
    TypeError_NotInScope        |
    TypeError_UnequalTerms      ;
    // ..

export interface TypeError_NotInScope {
    kind: 'NotInScope';
    payloads: {
        name: Syntax.QName;
        range: Syntax.Range;
        suggestions: Syntax.QName[];
    }[];
}

export interface TypeError_UnequalTerms {
    kind: 'UnequalTerms';
    comparison: string;
    term1: string;
    term2: string;
    type: string;
    reason: string;
}
