// raw input string from text editor
export type TextInput = string;


export type AgdaResponse =
    AR.InfoAction |
    AR.StatusAction |
    AR.GoalsAction |
    AR.GiveAction |
    AR.ParseError |
    AR.Goto |
    AR.SolveAllAction |
    AR.MakeCaseAction |
    AR.MakeCaseActionExtendLam |
    AR.HighlightClear |
    AR.HighlightAddAnnotations |
    AR.HighlightLoadAndDeleteAction |
    AR.UnknownAction;

export namespace AR {
    export interface InfoAction                     {
        type: InfoActionType;
        content: Array<string>;
    }
    export interface StatusAction                   { content: Array<string>; }
    export interface GoalsAction                    { content: Array<string>; }
    export interface GiveAction                     {
        index: Number;
        content: Array<string>;
        hasParenthesis: boolean;
    }
    export interface ParseError                     { content: Array<string>; }
    export interface Goto                           {
        filepath: string;
        position: string;
    }
    export interface SolveAllAction                 { solution: Array<Array<string>>; }
    export interface MakeCaseAction                 { content: string; }
    export interface MakeCaseActionExtendLam        { content: string; }
    export interface HighlightClear                 { content: Array<string>; }
    export interface HighlightAddAnnotations        { content: Array<string>; }
    export interface HighlightLoadAndDeleteAction   { content: string; }
    export interface UnknownAction                  { content: Array<string>; }
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
