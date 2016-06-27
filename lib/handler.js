"use strict";
var _ = require("lodash");
function handleAgdaResponse(core, response) {
    switch (response.type) {
        case 0 /* InfoAction */:
            handleInfoAction(core, response);
            break;
        case 1 /* StatusAction */:
            var status_1 = response;
            if (status_1.content.length !== 0) {
                core.view.setContent("Status", status_1.content);
            }
            break;
        case 2 /* GoalsAction */:
            var goals = response.content;
            core.textBuffer.onGoalsAction(goals);
            break;
        case 3 /* GiveAction */:
            var give = response;
            core.textBuffer.onGiveAction(give.index, give.content, give.hasParenthesis);
            break;
        case 4 /* ParseError */:
            console.error("Agda parse error: " + response.content);
            break;
        case 5 /* Goto */:
            var res = response;
            core.textBuffer.onGoto(res.filepath, res.position);
            break;
        case 6 /* SolveAllAction */:
            var solutions = response.solutions;
            solutions.forEach(function (solution) {
                core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(core.process.give);
            });
            break;
        case 7 /* MakeCaseAction */:
            core.textBuffer
                .onMakeCaseAction(response.content)
                .then(function () {
                core.commander.load()
                    .catch(function (error) { throw error; });
            });
            break;
        case 8 /* MakeCaseActionExtendLam */:
            core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(function () {
                core.commander.load()
                    .catch(function (error) { throw error; });
            });
            break;
        case 9 /* HighlightClear */:
            core.highlightManager.destroyAll();
            break;
        case 10 /* HighlightAddAnnotations */:
            var annotations = response.content;
            annotations.forEach(function (annotation) {
                var unsolvedmeta = _.includes(annotation.type, "unsolvedmeta");
                var terminationproblem = _.includes(annotation.type, "terminationproblem");
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            });
            break;
        case 11 /* HighlightLoadAndDeleteAction */:
            // ???
            break;
        case 12 /* UnknownAction */:
            console.error("Agda.ResponseType.UnknownAction:");
            console.error(response);
            break;
        default:
            console.error("Agda.ResponseType: " + JSON.stringify(response));
    }
}
exports.handleAgdaResponse = handleAgdaResponse;
function handleInfoAction(core, action) {
    switch (action.infoActionType) {
        case 0 /* AllGoals */:
            if (action.content.length === 0)
                core.view.setContent("No Goals", []);
            else
                core.view.setContent("Goals", action.content, "type-judgement");
            break;
        case 1 /* Error */:
            core.view.setContent("Error", action.content, "error");
            break;
        case 2 /* TypeChecking */:
            core.view.setContent("Type Checking", action.content);
            break;
        case 3 /* CurrentGoal */:
            core.view.setContent("Current Goal", action.content, "value");
            break;
        case 4 /* InferredType */:
            core.view.setContent("Inferred Type", action.content);
            break;
        case 5 /* ModuleContents */:
            core.view.setContent("Module Contents", action.content);
            break;
        case 6 /* Context */:
            core.view.setContent("Context", action.content, "type-judgement");
            break;
        case 7 /* GoalTypeEtc */:
            core.view.setContent("Goal Type and Context", action.content, "type-judgement");
            break;
        case 8 /* NormalForm */:
            core.view.setContent("Normal Form", action.content, "value");
            break;
        case 9 /* Intro */:
            core.view.setContent("Intro", ['No introduction forms found']);
            break;
        case 10 /* Auto */:
            core.view.setContent("Auto", ['No solution found']);
            break;
        case 11 /* Constraints */:
            core.view.setContent("Constraints", action.content, "type-judgement");
            break;
        case 12 /* ScopeInfo */:
            core.view.setContent("Scope Info", action.content);
            break;
        default:
            console.error("unknown info action " + action);
    }
}
