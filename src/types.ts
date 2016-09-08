import Goal from './goal';

import { EventEmitter } from 'events';
import { ParsedPath } from 'path';
type Range = any;

export type TextInput = string;

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
    Raw,
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

//
//  View
//

namespace View {

    export interface State {
        emitter: EventEmitter;
        view: ViewState;
        header: HeaderState;
        inputMethod: InputMethodState;
        miniEditor: MiniEditorState;
        body: BodyState;
    }

    export interface ViewState {
        activated: boolean;
        mounted: boolean;
        mountAt: {
            previous: MountingPosition,
            current: MountingPosition
        };
    }

    export const enum MountingPosition {
        Pane,
        Bottom
    }

    export interface InputMethodState {
        enableInMiniEditor: boolean;
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

    export interface BodyState {
        banner: BannerItem[];
        body: Body;
        error: Error;
        plainText: string;
        maxBodyHeight: number;
    }

    export interface MiniEditorState {
        activate: boolean;
        placeholder: string;
    }

    // Legacy shit below


    export const enum Type {
        PlainText,
        Error,
        Warning,
        Judgement,
        Value
    }

    export type JudgementForm = 'goal' |
        'type judgement' |
        'meta' |
        'term' |
        'sort' ;


    ////////////////////////////////////////////
    // Body components
    ////////////////////////////////////////////

    export interface Content {
        banner: BannerItem[],
        body: BodyItem[]
    }

    export interface BannerItem {
        type: string,
        label: string
    }

    export interface Goal {
        judgementForm: JudgementForm,
        type: string,
        index: string
    }

    export interface Judgement {
        judgementForm: JudgementForm,
        type: string,
        expr: string,
        index?: string
    }

    export interface Term {
        judgementForm: JudgementForm,
        expr: string
    }

    export interface Meta {
        judgementForm: JudgementForm,
        type: string,
        location: Location,
        index: string
    }

    export interface Sort {
        judgementForm: JudgementForm,
        location: Location,
        index: string
    }


    export type BodyItem = Goal | Judgement | Term | Meta | Sort;

    export interface Body {
        goal: Goal[],
        judgement: Judgement[],
        term: Term[],
        meta: Meta[],
        sort: Sort[]
    }

}

namespace Agda {

    export type Response =
        InfoAction |
        StatusAction |
        GoalsAction |
        GiveAction |
        ParseError |
        Goto |
        SolveAllAction |
        MakeCaseAction |
        MakeCaseActionExtendLam |
        HighlightClear |
        HighlightAddAnnotations |
        HighlightLoadAndDeleteAction |
        UnknownAction

    export interface InfoAction {
        kind: 'InfoAction';
        infoActionKind: 'AllGoals' | 'Error' | 'TypeChecking' | 'CurrentGoal' |
            'InferredType' | 'ModuleContents' | 'Context' | 'GoalTypeEtc' |
            'NormalForm' | 'Intro' | 'Auto' | 'Constraints' | 'ScopeInfo' |
            'Unknown';
        content: string[];
    }

    export interface StatusAction {
        kind: 'StatusAction';
        content: string[];
    }
    export interface GoalsAction {
        kind: 'GoalsAction';
        content: number[];
    }
    export interface GiveAction {
        kind: 'GiveAction';
        index: number;
        content: string;
        hasParenthesis: boolean;
    }

    export interface ParseError {
        kind: 'ParseError';
        content: string[];
    }

    export interface Goto {
        kind: 'Goto';
        filepath: string;
        position: number;
    }
    export interface SolveAllAction {
        kind: 'SolveAllAction';
        solutions: {
            index: number,
            expression: string
        }[];
    }
    export interface MakeCaseAction {
        kind: 'MakeCaseAction';
        content: string[];
    }
    export interface MakeCaseActionExtendLam {
        kind: 'MakeCaseActionExtendLam';
        content: string[];
    }
    export interface HighlightClear {
        kind: 'HighlightClear';
        content: string[];
    }
    export interface HighlightAddAnnotations {
        kind: 'HighlightAddAnnotations';
        content: Annotation[];
    }

    export interface HighlightLoadAndDeleteAction {
        kind: 'HighlightLoadAndDeleteAction';
        content: string;
    }
    export interface UnknownAction {
        kind: 'UnknownAction';
        content: string[];
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
}

//
//  agda-mode commands
//

type CommandKind = 'Load' | 'Quit' | 'Restart' | 'Compile' |
    'ToggleDisplayOfImplicitArguments' | 'Info' | 'ShowConstraints' |
    'SolveConstraints' | 'ShowGoals' | 'NextGoal' | 'PreviousGoal' |
    'WhyInScope' | 'InferType' | 'ModuleContents' | 'ComputeNormalForm' |
    'ComputeNormalFormIgnoreAbstract' | 'Give' | 'Refine' | 'Auto' | 'Case' |
    'GoalType' | 'Context' | 'GoalTypeAndContext' | 'GoalTypeAndInferredType' |
    'InputSymbol';
type Normalization = 'Simplified' | 'Instantiated' | 'Normalised';

type Command = {
    kind: CommandKind,
    normalization?: Normalization,
    editsFile: boolean
}


type CommandResult = {
    status: 'Issued',
    command: string
} | {
    status: 'Canceled'
};


// Occurence & Location
export interface Occurence {
    location: Location,
    body: string
}

export interface Location {
    path: string,
    range: Range,
    isSameLine: boolean
}


type Suggestion = string[];
////////////////////////////////////////////
// Errors
////////////////////////////////////////////

type Error = Error.NotInScope |
    Error.TypeMismatch |
    Error.DefinitionTypeMismatch |
    Error.BadConstructor |
    Error.RHSOmitted |
    Error.MissingType |
    Error.MultipleDefinition |
    Error.MissingDefinition |
    Error.Termination |
    Error.ConstructorTarget |
    Error.FunctionType |
    Error.ModuleMismatch |
    Error.Parse |
    Error.CaseSingleHole |
    Error.PatternMatchOnNonDatatype |
    // ApplicationParseError |
    // TerminationError |
    // ParseError |
    Error.Unparsed;

namespace Error {
    export interface NotInScope {
        kind: 'NotInScope',
        location: Location,
        suggestion: Suggestion,
        expr: string
    }

    export interface TypeMismatch {
        kind: 'TypeMismatch',
        location: Location
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }

    export interface DefinitionTypeMismatch {
        kind: 'DefinitionTypeMismatch',
        location: Location
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }

    export interface BadConstructor {
        kind: 'BadConstructor',
        location: Location,
        constructor: string,
        constructorType: string,
        expr: string,
        exprType: string
    }

    export interface RHSOmitted {
        kind: 'RHSOmitted',
        location: Location,
        expr: string,
        exprType: string
    }

    export interface MissingType {
        kind: 'MissingType';
        location: Location;
        expr: string;
        decl: string;
    }

    export interface MultipleDefinition {
        kind: 'MultipleDefinition',
        location: Location,
        locationPrev: Location,
        expr: string,
        decl: string,
        declType: string
    }

    export interface MissingDefinition {
        kind: 'MissingDefinition',
        location: Location,
        expr: string
    }

    export interface Termination {
        kind: 'Termination',
        location: Location,
        expr: string,
        calls: {
            expr: string,
            location: Location
        }[]
    }

    export interface ConstructorTarget {
        kind: 'ConstructorTarget',
        location: Location,
        expr: string,
        ctor: string,
        decl: string
    }

    export interface FunctionType {
        kind: 'FunctionType',
        location: Location,
        expr: string,
        exprType: string
    }

    export interface ModuleMismatch {
        kind: 'ModuleMismatch',
        wrongPath: string,
        rightPath: string,
        moduleName: string
    }

    export interface Parse {
        kind: 'Parse',
        location: Location
        message: string,
        expr: string,
    }

    export interface CaseSingleHole {
        kind: 'CaseSingleHole',
        location: Location,
        expr: string,
        exprType: string
    }

    export interface PatternMatchOnNonDatatype {
        kind: 'PatternMatchOnNonDatatype',
        location: Location,
        nonDatatype: string,
        expr: string,
        exprType: string
    }
    // export interface ApplicationParseError {
    //     type: ErrorType,
    //     expr: string,
    //     location: Location
    // }
    //
    export interface Unparsed {
        kind: 'Unparsed',
        input: string,
    }
}


export {
    Agda,
    Hole,
    Goal,
    Token,
    TokenType,
    // commands
    CommandKind,
    Command,
    Normalization,
    CommandResult,
    Suggestion,
    // view
    View,
    // Errors
    Error
}
