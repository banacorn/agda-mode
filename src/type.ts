import { Duplex } from 'stream';
import { EmacsAgdaError } from './parser/emacs/error';

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
    }

    export interface Protocol {
        log: ReqRes[];
        id: number;// for indexing ReqRes

        pending: boolean;

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
        emacsError: EmacsAgdaError;
        emacsMessage: string;
        error: Agda.Error;
        plainText: string;
        solutions: Solutions;
        maxBodyHeight: number;
    }

    export type SettingsURI = {
        path: '/' | '/Connection' | '/Protocol' | '/Protocol/*';
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
        range: Agda.Syntax.Range;
        index: string;
    }

    export interface Sort {
        judgementForm: ExprKind;
        range: Agda.Syntax.Range;
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
        range: Agda.Syntax.Range
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
        error: Agda.Error;
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

        //
        //  Range
        //

        export type Position = [number, number, number] | [number, number];
        export type Interval = {
            start: Position;
            end  : Position;
        };

        export class Range implements ToString {
            intervals: Interval[];
            source?: string;
            constructor(obj) {
                this.intervals = obj.intervals;
                this.source = obj.source;
            }

            toString(): string {
                const lineNums = this.intervals.map((interval) => {
                    if (interval.start[0] === interval.end[0])
                        return `${interval.start[0]},${interval.start[1]}-${interval.end[1]}`
                    else
                        return `${interval.start[0]},${interval.start[1]}-${interval.end[0]},${interval.end[1]}`
                }).join(' ');

                if (this.source && lineNums) {
                    return `${this.source}:${lineNums}`;
                }

                if (this.source && lineNums === '') {
                    return `${this.source}`;
                }

                if (this.source === null) {
                    return `${lineNums}`;
                }
            }
        }
        // export type Range = {
        // }
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
        TypeError_NotInScope;
        // ..

    export interface TypeError_NotInScope {
        kind: 'NotInScope';
        payloads: {
            name: Syntax.QName;
            range: Syntax.Range;
            suggestions: String[];
        }[];
    }
}

export interface HasRange {
    range: Agda.Syntax.Range;
}

export interface ToString {
    toString(): string;
}

// Occurence
export interface Occurence {
    range: Agda.Syntax.Range,
    body: string
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
export type Protocol = 'Emacs' | 'JSON';
export type ValidPath = {
    path: Path;
    version: Version;
    supportedProtocol: Protocol[];
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
