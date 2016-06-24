import * as _ from "lodash";
import { Command, CommandType, Normalization } from "../types";

function parseNormalization(raw: string): Normalization {
    switch (raw) {
        case "Simplified":      return Normalization.Simplified;
        case "Instantiated":    return Normalization.Instantiated;
        case "Normalised":      return Normalization.Normalised;
        default:                throw `unknown normalization: ${raw}`;
    }
}

function parseCommand(raw: string): Command {
    const result = raw.match(/^agda-mode:((?:\w|\-)*)(?:\[(\w*)\])?/);
    if (result === null) throw "command parse error";

    switch (result[1]) {
        case "load": return {
            type: CommandType.Load
        };
        case "quit": return {
            type: CommandType.Quit
        };
        case "restart": return {
            type: CommandType.Restart
        };
        case "compile": return {
            type: CommandType.Compile
        };
        case "toggle-display-of-implicit-arguments": return {
            type: CommandType.ToggleDisplayOfImplicitArguments
        };
        case "info": return {
            type: CommandType.Info
        };
        case "show-constraints": return {
            type: CommandType.ShowConstraints
        };
        case "solve-constraints": return {
            type: CommandType.SolveConstraints
        };
        case "next-goal": return {
            type: CommandType.NextGoal
        };
        case "previous-goal": return {
            type: CommandType.PreviousGoal
        };
        case "why-in-scope": return {
            type: CommandType.WhyInScope
        };
        case "infer-type": return {
            type: CommandType.InferType,
            normalization: parseNormalization(result[2])
        };
        case "module-contents": return {
            type: CommandType.ModuleContents,
            normalization: parseNormalization(result[2])
        };
        case "compute-normal-form": return {
            type: CommandType.ComputeNormalForm
        };
        case "compute-normal-form-ignore-abstract": return {
            type: CommandType.ComputeNormalFormIgnoreAbstract
        };
        case "give": return {
            type: CommandType.Give
        };
        case "refine": return {
            type: CommandType.Refine
        };
        case "auto": return {
            type: CommandType.Auto
        };
        case "case": return {
            type: CommandType.Case
        };
        case "goal-type": return {
            type: CommandType.GoalType,
            normalization: parseNormalization(result[2])
        };
        case "context": return {
            type: CommandType.Context,
            normalization: parseNormalization(result[2])
        };
        case "goal-type-and-context": return {
            type: CommandType.GoalTypeAndContext,
            normalization: parseNormalization(result[2])
        };
        case "goal-type-and-inferred-type": return {
            type: CommandType.GoalTypeAndInferredType,
            normalization: parseNormalization(result[2])
        };
        case "input-symbol": return {
            type: CommandType.InputSymbol,
        };
        default: throw `unknown command ${raw}`;
    }
}

export {
    parseNormalization,
    parseCommand
}
