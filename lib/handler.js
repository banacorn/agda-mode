"use strict";
var _ = require('lodash');
function handleAgdaResponse(core, response) {
    switch (response.kind) {
        case 'InfoAction':
            handleInfoAction(core, response);
            break;
        case 'StatusAction':
            if (response.content.length !== 0) {
                core.viewLegacy.set('Status', response.content);
            }
            break;
        case 'GoalsAction':
            core.textBuffer.onGoalsAction(response.content);
            break;
        case 'GiveAction':
            core.textBuffer.onGiveAction(response.index, response.content, response.hasParenthesis);
            break;
        case 'ParseError':
            console.error("Agda parse error: " + response.content);
            break;
        case 'Goto':
            core.textBuffer.onGoto(response.filepath, response.position);
            break;
        case 'SolveAllAction':
            var solutions = response.solutions;
            solutions.forEach(function (solution) {
                core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(core.process.give);
            });
            break;
        case 'MakeCaseAction':
            core.textBuffer
                .onMakeCaseAction(response.content)
                .then(function () {
                core.commander.load()
                    .catch(function (error) { throw error; });
            });
            break;
        case 'MakeCaseActionExtendLam':
            core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(function () {
                core.commander.load()
                    .catch(function (error) { throw error; });
            });
            break;
        case 'HighlightClear':
            core.highlightManager.destroyAll();
            break;
        case 'HighlightAddAnnotations':
            var annotations = response.content;
            annotations.forEach(function (annotation) {
                var unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                var terminationproblem = _.includes(annotation.type, 'terminationproblem');
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            });
            break;
        case 'HighlightLoadAndDeleteAction':
            // ???
            break;
        case 'UnknownAction':
            console.error("'UnknownAction:");
            console.error(response);
            break;
        default:
            console.error("Agda.ResponseType: " + JSON.stringify(response));
    }
}
exports.handleAgdaResponse = handleAgdaResponse;
function handleInfoAction(core, action) {
    switch (action.infoActionKind) {
        case 'AllGoals':
            if (action.content.length === 0)
                core.viewLegacy.set('No Goals', []);
            else
                core.viewLegacy.set('Goals', action.content, 3 /* Judgement */);
            break;
        case 'Error':
            core.viewLegacy.set('Error', action.content, 1 /* Error */);
            break;
        case 'TypeChecking':
            core.viewLegacy.set('Type Checking', action.content);
            break;
        case 'CurrentGoal':
            core.viewLegacy.set('Current Goal', action.content, 4 /* Value */);
            break;
        case 'InferredType':
            core.viewLegacy.set('Inferred Type', action.content);
            break;
        case 'ModuleContents':
            core.viewLegacy.set('Module Contents', action.content);
            break;
        case 'Context':
            core.viewLegacy.set('Context', action.content, 3 /* Judgement */);
            break;
        case 'GoalTypeEtc':
            core.viewLegacy.set('Goal Type and Context', action.content, 3 /* Judgement */);
            break;
        case 'NormalForm':
            core.viewLegacy.set('Normal Form', action.content, 4 /* Value */);
            break;
        case 'Intro':
            core.viewLegacy.set('Intro', ['No introduction forms found']);
            break;
        case 'Auto':
            core.viewLegacy.set('Auto', ['No solution found']);
            break;
        case 'Constraints':
            core.viewLegacy.set('Constraints', action.content, 3 /* Judgement */);
            break;
        case 'ScopeInfo':
            core.viewLegacy.set('Scope Info', action.content);
            break;
        case 'Unknown':
            core.viewLegacy.set(_.head(action.content), _.tail(action.content));
            break;
        default:
            console.error("unknown info action:");
            console.error(action);
    }
}
//# sourceMappingURL=handler.js.map