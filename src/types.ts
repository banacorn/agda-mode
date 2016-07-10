import Goal from "./goal";

import { ParsedPath } from "path";
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

namespace Agda {

    // base interface
    export interface Response {
        type: ResponseType
    }

    export const enum ResponseType {
        InfoAction,
        StatusAction,
        GoalsAction,
        GiveAction,
        ParseError,
        Goto,
        SolveAllAction,
        MakeCaseAction,
        MakeCaseActionExtendLam,
        HighlightClear,
        HighlightAddAnnotations,
        HighlightLoadAndDeleteAction,
        UnknownAction
    }

    export interface InfoAction extends Response {
        infoActionType: InfoActionType;
        content: string[];
    }
    export interface StatusAction extends Response {
        content: string[];
    }
    export interface GoalsAction extends Response {
        content: number[];
    }
    export interface GiveAction extends Response {
        index: number;
        content: string;
        hasParenthesis: boolean;
    }

    export interface ParseError extends Response {
        content: string[];
    }

    export interface Goto extends Response {
        filepath: string;
        position: number;
    }
    export interface SolveAllAction extends Response {
        solutions: {
            index: number,
            expression: string
        }[];
    }
    export interface MakeCaseAction extends Response {
        content: string[];
    }
    export interface MakeCaseActionExtendLam extends Response {
        content: string;
    }
    export interface HighlightClear extends Response {
        content: string[];
    }
    export interface HighlightAddAnnotations extends Response {
        content: Annotation[];
    }

    export interface HighlightLoadAndDeleteAction extends Response {
        content: string;
    }
    export interface UnknownAction extends Response {
        content: string[];
    }

    export const enum InfoActionType {
        AllGoals,
        Error,
        TypeChecking,
        CurrentGoal,
        InferredType,
        ModuleContents,
        Context,
        GoalTypeEtc,
        NormalForm,
        Intro,
        Auto,
        Constraints,
        ScopeInfo
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

// base interface
interface Command {
    type: CommandType;
    normalization?: Normalization;
}

const enum CommandType {
    Load,
    Quit,
    Restart,
    Compile,
    ToggleDisplayOfImplicitArguments,
    Info,
    ShowConstraints,
    SolveConstraints,
    ShowGoals,
    NextGoal,
    PreviousGoal,
    WhyInScope,
    InferType,
    ModuleContents,
    ComputeNormalForm,
    ComputeNormalFormIgnoreAbstract,
    Give,
    Refine,
    Auto,
    Case,
    GoalType,
    Context,
    GoalTypeAndContext,
    GoalTypeAndInferredType,
    InputSymbol
}

type Normalization = "Simplified" | "Instantiated" | "Normalised";
// const enum Normalization {
//     Simplified,
//     Instantiated,
//     Normalised
// }

type Result = Command;

//
//  View
//

namespace View {

    export const enum Type {
        PlainText,
        Error,
        Warning,
        Judgement,
        Value
    }

    export type JudgementForm = "goal" |
        "type judgement" |
        "meta" |
        "term" |
        "sort" ;

    // Occurence & Location
    export interface Location {
        path: string,
        range: Range,
        isSameLine: boolean
    }

    export interface Occurence {
        location: Location,
        body: string
    }


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

    export type Suggestion = string[];

    ////////////////////////////////////////////
    // Errors
    ////////////////////////////////////////////

    export type Error = NotInScope |
        TypeMismatch |
        DefinitionTypeMismatch |
        BadConstructor |
        RHSOmitted |
        MissingType |
        MultipleDefinition |
        MissingDefinition |
        Termination |
        ConstructorTarget |
        FunctionType |
        ModuleMismatch |
        Parse |
        CaseSingleHole |
        // ApplicationParseError |
        // TerminationError |
        // ParseError |
        Unparsed;

    export const enum ErrorType {
        NotInScope,
        TypeMismatch,
        DefinitionTypeMismatch,
        BadConstructor,
        RHSOmitted,
        MissingType,
        MultipleDefinition,
        MissingDefinition,
        Termination,
        ConstructorTarget,
        FunctionType,
        ModuleMismatch,
        Parse,
        CaseSingleHole,
        // ApplicationParseError,
        // TerminationError,
        // ParseError,
        Unparsed
    }

    export interface NotInScope {
        type: ErrorType,
        location: Location,
        suggestion: Suggestion,
        expr: string
    }

    export interface TypeMismatch {
        type: ErrorType,
        location: Location
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }

    export interface DefinitionTypeMismatch {
        type: ErrorType,
        location: Location
        expected: string,
        expectedType: string,
        actual: string,
        expr: string,
        exprType: string
    }

    export interface BadConstructor {
        type: ErrorType,
        location: Location,
        constructor: string,
        constructorType: string,
        expr: string,
        exprType: string
    }

    export interface RHSOmitted {
        type: ErrorType,
        location: Location,
        expr: string,
        exprType: string
    }

    export interface MissingType {
        type: ErrorType,
        location: Location,
        expr: string
    }

    export interface MultipleDefinition {
        type: ErrorType,
        location: Location,
        locationPrev: Location,
        expr: string,
        decl: string,
        declType: string
    }

    export interface MissingDefinition {
        type: ErrorType,
        location: Location,
        expr: string
    }

    export interface Termination {
        type: ErrorType,
        location: Location,
        expr: string,
        calls: {
            expr: string,
            location: Location
        }[]
    }

    export interface ConstructorTarget {
        type: ErrorType,
        location: Location,
        expr: string,
        ctor: string,
        decl: string
    }

    export interface FunctionType {
        type: ErrorType,
        location: Location,
        expr: string,
        exprType: string
    }

    export interface ModuleMismatch {
        type: ErrorType,
        wrongPath: string,
        rightPath: string,
        moduleName: string
    }

    export interface Parse {
        type: ErrorType,
        location: Location
        message: string,
        expr: string,
    }

    export interface CaseSingleHole {
        type: ErrorType,
        location: Location,
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
        type: ErrorType,
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
    Command,
    CommandType,
    Normalization,
    Result,
    // view
    View
}
