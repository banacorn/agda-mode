"use strict";
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
function parseCommand(raw) {
    const result = raw.match(/^agda-mode:((?:\w|\-)*)(?:\[(\w*)\])?/);
    if (result === null)
        throw 'command parse error';
    switch (result[1]) {
        case 'load': return {
            kind: 'Load',
            editsFile: true,
            expectedGoalsActionReplies: 1
        };
        case 'quit': return {
            kind: 'Quit',
            editsFile: false,
            expectedGoalsActionReplies: 0
        };
        case 'restart': return {
            kind: 'Restart',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'compile': return {
            kind: 'Compile',
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'toggle-display-of-implicit-arguments': return {
            kind: 'ToggleDisplayOfImplicitArguments',
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'info': return {
            kind: 'Info',
            editsFile: false,
            expectedGoalsActionReplies: 0
        };
        case 'show-constraints': return {
            kind: 'ShowConstraints',
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'show-goals': return {
            kind: 'ShowGoals',
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'solve-constraints': return {
            kind: 'SolveConstraints',
            editsFile: true,
            expectedGoalsActionReplies: 1
        };
        case 'next-goal': return {
            kind: 'NextGoal',
            editsFile: false,
            expectedGoalsActionReplies: 0
        };
        case 'previous-goal': return {
            kind: 'PreviousGoal',
            editsFile: false,
            expectedGoalsActionReplies: 0
        };
        case 'toggle-docking': return {
            kind: 'ToggleDocking',
            editsFile: false,
            expectedGoalsActionReplies: 0
        };
        case 'why-in-scope': return {
            kind: 'WhyInScope',
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'infer-type': return {
            kind: 'InferType',
            normalization: parseNormalization(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'module-contents': return {
            kind: 'ModuleContents',
            normalization: parseNormalization(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'compute-normal-form': return {
            kind: 'ComputeNormalForm',
            computeMode: parseComputeMode(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'give': return {
            kind: 'Give',
            editsFile: true,
            expectedGoalsActionReplies: 1
        };
        case 'refine': return {
            kind: 'Refine',
            editsFile: true,
            expectedGoalsActionReplies: 1
        };
        case 'auto': return {
            kind: 'Auto',
            editsFile: true,
            expectedGoalsActionReplies: 1
        };
        case 'case': return {
            kind: 'Case',
            editsFile: true,
            expectedGoalsActionReplies: 2
        };
        case 'goal-type': return {
            kind: 'GoalType',
            normalization: parseNormalization(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'context': return {
            kind: 'Context',
            normalization: parseNormalization(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'goal-type-and-context': return {
            kind: 'GoalTypeAndContext',
            normalization: parseNormalization(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'goal-type-and-inferred-type': return {
            kind: 'GoalTypeAndInferredType',
            normalization: parseNormalization(result[2]),
            editsFile: false,
            expectedGoalsActionReplies: 1
        };
        case 'input-symbol': return {
            kind: 'InputSymbol',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'input-symbol-curly-bracket': return {
            kind: 'InputSymbolCurlyBracket',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'input-symbol-bracket': return {
            kind: 'InputSymbolBracket',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'input-symbol-parenthesis': return {
            kind: 'InputSymbolParenthesis',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'input-symbol-double-quote': return {
            kind: 'InputSymbolDoubleQuote',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'input-symbol-single-quote': return {
            kind: 'InputSymbolSingleQuote',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        case 'input-symbol-back-quote': return {
            kind: 'InputSymbolBackQuote',
            editsFile: true,
            expectedGoalsActionReplies: 0
        };
        default: throw `unknown command ${raw}`;
    }
}
exports.parseCommand = parseCommand;
//# sourceMappingURL=command.js.map