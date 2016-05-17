import { Transform } from 'stream';
import * as _ from 'lodash';
import { AgdaResponse, AR, InfoActionType } from '../../types';


export class ParseAgdaResponse extends Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(tokens: Array<string>, encoding: string, next: Function): void {
        this.push(parseAgdaResponse(tokens));
        next();
    }
}

function parseAgdaResponse(tokens: Array<string>): AgdaResponse {
    switch (tokens[0]) {
        case "agda2-info-action":
            let type = parseInfoActionType(tokens[1]);
            let content = tokens.length === 3 ? [] : _.compact(tokens[2].split("\\n"));
            return {
                type: type,
                content: content
            } as AR.InfoAction;
        case "agda2-status-action":
            return {
                content: tokens.slice(1, 2)
            } as AR.StatusAction;
        case "agda2-goals-action":
            return {
                content: tokens.slice(1, 2)
            } as AR.GoalsAction;
        case "agda2-give-action":
            let index = parseInt(tokens[1]);
            // with parenthesis: ["agda2-give-action", 1, "'paren"]
            // w/o  parenthesis: ["agda2-give-action", 1, "'no-paren"]
            // with content    : ["agda2-give-action", 0, ...]
            switch (tokens[2]) {
                case "'paren": return {
                    index: index,
                    content: [],
                    hasParenthesis: true
                };
                case "'no-paren": return {
                    index: index,
                    content: [],
                    hasParenthesis: false
                };
                default: return {
                    index: index,
                    content: tokens.slice(2),
                    hasParenthesis: false
                };
            }
        case "agda2-parse-error":
            return {
                content: tokens.slice(1)
            } as AR.ParseError;
        case "agda2-goto":
        case "agda2-maybe-goto":
            return {
                filepath: tokens[1][0],
                position: tokens[1][2]
            } as AR.Goto;
        case "agda2-solveAll-action":
            return {
                solution: _.chunk(tokens[1], 2)
            } as AR.SolveAllAction;
        case "agda2-make-case-action":
            return {
                content: tokens[1]
            } as AR.MakeCaseAction;
        case "agda2-make-case-action-extendlam":
            return {
                content: tokens[1]
            } as AR.MakeCaseActionExtendLam;
        case "agda2-highlight-clear":
            return {
                content: tokens
            } as AR.HighlightClear;
        case "agda2-highlight-add-annotations":
            return {
                content: tokens
            } as AR.HighlightAddAnnotations;
        case "agda2-highlight-load-and-delete-action":
            return {
                content: tokens[1]
            } as AR.HighlightLoadAndDeleteAction;
        default:
            return {
                content: tokens
            } as AR.UnknownAction;
    }
}
function parseInfoActionType(s: String): InfoActionType {
    switch (s) {
        case "*All Goals*":         return InfoActionType.AllGoals;
        case "*Error*":             return InfoActionType.Error;
        case "*Type-checking*":     return InfoActionType.TypeChecking;
        case "*Current Goal*":      return InfoActionType.CurrentGoal;
        case "*Inferred Type*":     return InfoActionType.InferredType;
        case "*Module contents*":   return InfoActionType.ModuleContents;
        case "*Context*":           return InfoActionType.Context;
        case "*Goal type etc.*":    return InfoActionType.GoalTypeEtc;
        case "*Normal Form*":       return InfoActionType.NormalForm;
        case "*Intro*":             return InfoActionType.Intro;
        case "*Auto*":              return InfoActionType.Auto;
        case "*Constraints*":       return InfoActionType.Constraints;
        case "*Scope Info*":        return InfoActionType.ScopeInfo;
    }
}
