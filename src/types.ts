import Goal from "./goal";


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
        content: string[];
    }
    export interface GiveAction extends Response {
        index: number;
        content: string[];
        hasParenthesis: boolean;
    }

    export interface ParseError extends Response {
        content: string[];
    }

    export interface Goto extends Response {
        filepath: string;
        position: string;
    }
    export interface SolveAllAction extends Response {
        solution: string[][];
    }
    export interface MakeCaseAction extends Response {
        content: string;
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

namespace Command {

    export interface GoalSpecific {
        type: GoalSpecificCommandType
        goal: Goal
    }

    export const enum GoalSpecificCommandType {
        Give
    }


    // export interface Response {
    //     type: ResponseType
    // }

    // export const enum ResponseType {
    //     InfoAction,
    //     StatusAction,
    //     GoalsAction,
    //     GiveAction,
    //     ParseError,
    //     Goto,
    //     SolveAllAction,
    //     MakeCaseAction,
    //     MakeCaseActionExtendLam,
    //     HighlightClear,
    //     HighlightAddAnnotations,
    //     HighlightLoadAndDeleteAction,
    //     UnknownAction
    // }
}

export {
    Agda,
    Command,
    Hole,
    Goal,
    Token,
    TokenType
}
