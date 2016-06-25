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
            type: 0
        };
        case "quit": return {
            type: 1
        };
        case "restart": return {
            type: 2
        };
        case "compile": return {
            type: 3
        };
        case "toggle-display-of-implicit-arguments": return {
            type: 4
        };
        case "info": return {
            type: 5
        };
        case "show-constraints": return {
            type: 6
        };
        case "show-goals": return {
            type: 8,
        };
        case "solve-constraints": return {
            type: 7
        };
        case "next-goal": return {
            type: 9
        };
        case "previous-goal": return {
            type: 10
        };
        case "why-in-scope": return {
            type: 11
        };
        case "infer-type": return {
            type: 12,
            normalization: parseNormalization(result[2])
        };
        case "module-contents": return {
            type: 13,
            normalization: parseNormalization(result[2])
        };
        case "compute-normal-form": return {
            type: 14
        };
        case "compute-normal-form-ignore-abstract": return {
            type: 15
        };
        case "give": return {
            type: 16
        };
        case "refine": return {
            type: 17
        };
        case "auto": return {
            type: 18
        };
        case "case": return {
            type: 19
        };
        case "goal-type": return {
            type: 20,
            normalization: parseNormalization(result[2])
        };
        case "context": return {
            type: 21,
            normalization: parseNormalization(result[2])
        };
        case "goal-type-and-context": return {
            type: 22,
            normalization: parseNormalization(result[2])
        };
        case "goal-type-and-inferred-type": return {
            type: 23,
            normalization: parseNormalization(result[2])
        };
        case "input-symbol": return {
            type: 24,
        };
        default: throw "unknown command " + raw;
    }
}
exports.parseCommand = parseCommand;
