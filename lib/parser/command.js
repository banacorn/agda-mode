"use strict";
function parseNormalization(raw) {
    switch (raw) {
        case "Simplified": return "Simplified";
        case "Instantiated": return "Instantiated";
        case "Normalised": return "Normalised";
        default: throw "unknown normalization: " + raw;
    }
}
exports.parseNormalization = parseNormalization;
function parseCommand(raw) {
    var result = raw.match(/^agda-mode:((?:\w|\-)*)(?:\[(\w*)\])?/);
    if (result === null)
        throw "command parse error";
    switch (result[1]) {
        case "load": return {
            type: 0 /* Load */
        };
        case "quit": return {
            type: 1 /* Quit */
        };
        case "restart": return {
            type: 2 /* Restart */
        };
        case "compile": return {
            type: 3 /* Compile */
        };
        case "toggle-display-of-implicit-arguments": return {
            type: 4 /* ToggleDisplayOfImplicitArguments */
        };
        case "info": return {
            type: 5 /* Info */
        };
        case "show-constraints": return {
            type: 6 /* ShowConstraints */
        };
        case "show-goals": return {
            type: 8 /* ShowGoals */,
        };
        case "solve-constraints": return {
            type: 7 /* SolveConstraints */
        };
        case "next-goal": return {
            type: 9 /* NextGoal */
        };
        case "previous-goal": return {
            type: 10 /* PreviousGoal */
        };
        case "why-in-scope": return {
            type: 11 /* WhyInScope */
        };
        case "infer-type": return {
            type: 12 /* InferType */,
            normalization: parseNormalization(result[2])
        };
        case "module-contents": return {
            type: 13 /* ModuleContents */,
            normalization: parseNormalization(result[2])
        };
        case "compute-normal-form": return {
            type: 14 /* ComputeNormalForm */
        };
        case "compute-normal-form-ignore-abstract": return {
            type: 15 /* ComputeNormalFormIgnoreAbstract */
        };
        case "give": return {
            type: 16 /* Give */
        };
        case "refine": return {
            type: 17 /* Refine */
        };
        case "auto": return {
            type: 18 /* Auto */
        };
        case "case": return {
            type: 19 /* Case */
        };
        case "goal-type": return {
            type: 20 /* GoalType */,
            normalization: parseNormalization(result[2])
        };
        case "context": return {
            type: 21 /* Context */,
            normalization: parseNormalization(result[2])
        };
        case "goal-type-and-context": return {
            type: 22 /* GoalTypeAndContext */,
            normalization: parseNormalization(result[2])
        };
        case "goal-type-and-inferred-type": return {
            type: 23 /* GoalTypeAndInferredType */,
            normalization: parseNormalization(result[2])
        };
        case "input-symbol": return {
            type: 24 /* InputSymbol */,
        };
        default: throw "unknown command " + raw;
    }
}
exports.parseCommand = parseCommand;
