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
            kind: "Load",
            editsFile: true
        };
        case "quit": return {
            kind: "Quit",
            editsFile: false
        };
        case "restart": return {
            kind: "Restart",
            editsFile: true
        };
        case "compile": return {
            kind: "Compile",
            editsFile: false
        };
        case "toggle-display-of-implicit-arguments": return {
            kind: "ToggleDisplayOfImplicitArguments",
            editsFile: false
        };
        case "info": return {
            kind: "Info",
            editsFile: false
        };
        case "show-constraints": return {
            kind: "ShowConstraints",
            editsFile: false
        };
        case "show-goals": return {
            kind: "ShowGoals",
            editsFile: false
        };
        case "solve-constraints": return {
            kind: "SolveConstraints",
            editsFile: true
        };
        case "next-goal": return {
            kind: "NextGoal",
            editsFile: false
        };
        case "previous-goal": return {
            kind: "PreviousGoal",
            editsFile: false
        };
        case "toggle-docking": return {
            kind: "ToggleDocking",
            editsFile: false
        };
        case "why-in-scope": return {
            kind: "WhyInScope",
            editsFile: false
        };
        case "infer-type": return {
            kind: "InferType",
            normalization: parseNormalization(result[2]),
            editsFile: false
        };
        case "module-contents": return {
            kind: "ModuleContents",
            normalization: parseNormalization(result[2]),
            editsFile: false
        };
        case "compute-normal-form": return {
            kind: "ComputeNormalForm",
            editsFile: false
        };
        case "compute-normal-form-ignore-abstract": return {
            kind: "ComputeNormalFormIgnoreAbstract",
            editsFile: false
        };
        case "give": return {
            kind: "Give",
            editsFile: true
        };
        case "refine": return {
            kind: "Refine",
            editsFile: true
        };
        case "auto": return {
            kind: "Auto",
            editsFile: true
        };
        case "case": return {
            kind: "Case",
            editsFile: true
        };
        case "goal-type": return {
            kind: "GoalType",
            normalization: parseNormalization(result[2]),
            editsFile: false
        };
        case "context": return {
            kind: "Context",
            normalization: parseNormalization(result[2]),
            editsFile: false
        };
        case "goal-type-and-context": return {
            kind: "GoalTypeAndContext",
            normalization: parseNormalization(result[2]),
            editsFile: false
        };
        case "goal-type-and-inferred-type": return {
            kind: "GoalTypeAndInferredType",
            normalization: parseNormalization(result[2]),
            editsFile: false
        };
        case "input-symbol": return {
            kind: "InputSymbol",
            editsFile: true
        };
        case "input-symbol-curly-bracket": return {
            kind: "InputSymbolCurlyBracket",
            editsFile: true
        };
        case "input-symbol-bracket": return {
            kind: "InputSymbolBracket",
            editsFile: true
        };
        case "input-symbol-parenthesis": return {
            kind: "InputSymbolParenthesis",
            editsFile: true
        };
        case "input-symbol-double-quote": return {
            kind: "InputSymbolDoubleQuote",
            editsFile: true
        };
        case "input-symbol-single-quote": return {
            kind: "InputSymbolSingleQuote",
            editsFile: true
        };
        case "input-symbol-back-quote": return {
            kind: "InputSymbolBackQuote",
            editsFile: true
        };
        default: throw "unknown command " + raw;
    }
}
exports.parseCommand = parseCommand;
//# sourceMappingURL=command.js.map