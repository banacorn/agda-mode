"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function parseNormalization(raw) {
    switch (raw) {
        case 'Simplified': return 'Simplified';
        case 'Instantiated': return 'Instantiated';
        case 'Normalised': return 'Normalised';
        default: throw `unknown normalization: ${raw}`;
    }
}
exports.parseNormalization = parseNormalization;
function parseComputeMode(raw) {
    switch (raw) {
        case 'DefaultCompute': return 'DefaultCompute';
        case 'IgnoreAbstract': return 'IgnoreAbstract';
        case 'UseShowInstance': return 'UseShowInstance';
        default: throw `unknown compute mode: ${raw}`;
    }
}
// Parses commands invoked by key-bindings
function parseCommand(raw) {
    const result = raw.match(/^agda-mode:((?:\w|\-)*)(?:\[(\w*)\])?/);
    if (result === null)
        throw 'command parse error';
    switch (result[1]) {
        case 'load': return {
            kind: 'Load',
        };
        case 'quit': return {
            kind: 'Quit',
        };
        case 'restart': return {
            kind: 'Restart',
        };
        case 'abort': return {
            kind: 'Abort',
        };
        case 'compile': return {
            kind: 'Compile',
        };
        case 'toggle-display-of-implicit-arguments': return {
            kind: 'ToggleDisplayOfImplicitArguments',
        };
        case 'show-constraints': return {
            kind: 'ShowConstraints',
        };
        case 'show-goals': return {
            kind: 'ShowGoals',
        };
        case 'solve-constraints': return {
            kind: 'SolveConstraints',
        };
        case 'next-goal': return {
            kind: 'NextGoal',
        };
        case 'previous-goal': return {
            kind: 'PreviousGoal',
        };
        case 'toggle-docking': return {
            kind: 'ToggleDocking',
        };
        case 'search-about': return {
            kind: 'SearchAbout',
            normalization: parseNormalization(result[2]),
        };
        case 'why-in-scope': return {
            kind: 'WhyInScope',
        };
        case 'infer-type': return {
            kind: 'InferType',
            normalization: parseNormalization(result[2]),
        };
        case 'module-contents': return {
            kind: 'ModuleContents',
            normalization: parseNormalization(result[2]),
        };
        case 'compute-normal-form': return {
            kind: 'ComputeNormalForm',
            computeMode: parseComputeMode(result[2]),
        };
        case 'give': return {
            kind: 'Give',
        };
        case 'refine': return {
            kind: 'Refine',
        };
        case 'auto': return {
            kind: 'Auto',
        };
        case 'case': return {
            kind: 'Case',
        };
        case 'goal-type': return {
            kind: 'GoalType',
            normalization: parseNormalization(result[2]),
        };
        case 'context': return {
            kind: 'Context',
            normalization: parseNormalization(result[2]),
        };
        case 'goal-type-and-context': return {
            kind: 'GoalTypeAndContext',
            normalization: parseNormalization(result[2]),
        };
        case 'goal-type-and-inferred-type': return {
            kind: 'GoalTypeAndInferredType',
            normalization: parseNormalization(result[2]),
        };
        case 'input-symbol': return {
            kind: 'InputSymbol',
        };
        case 'input-symbol-curly-bracket': return {
            kind: 'InputSymbolCurlyBracket'
        };
        case 'input-symbol-bracket': return {
            kind: 'InputSymbolBracket',
        };
        case 'input-symbol-parenthesis': return {
            kind: 'InputSymbolParenthesis',
        };
        case 'input-symbol-double-quote': return {
            kind: 'InputSymbolDoubleQuote',
        };
        case 'input-symbol-single-quote': return {
            kind: 'InputSymbolSingleQuote',
        };
        case 'input-symbol-back-quote': return {
            kind: 'InputSymbolBackQuote',
        };
        case 'query-symbol': return {
            kind: 'QuerySymbol',
        };
        case 'go-to-definition': return {
            kind: 'GotoDefinition',
        };
        default: throw `unknown command ${raw}`;
    }
}
exports.parseCommand = parseCommand;
//# sourceMappingURL=command.js.map