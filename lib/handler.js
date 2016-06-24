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
                core.panel.setContent("Status", status_1.content);
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
            core.textBuffer
                .onSolveAllAction(response.solution[0], response.solution[1])
                .then(function (goal) {
                return core.process.give(goal);
            })
                .catch(function (error) { throw error; });
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
            core.highlight.destroy();
            break;
        case 10 /* HighlightAddAnnotations */:
            var annotations = response.content;
            annotations.forEach(function (annotation) {
                var unsolvedmeta = _.includes(annotation.type, "unsolvedmeta");
                var terminationproblem = _.includes(annotation.type, "terminationproblem");
                if (unsolvedmeta || terminationproblem) {
                    core.highlight.highlight(annotation);
                }
            });
            break;
        case 11 /* HighlightLoadAndDeleteAction */:
            // ???
            break;
        case 12 /* UnknownAction */:
            console.error("Agda.ResponseType.UnknownAction: " + response);
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
                core.panel.setContent("No Goals", []);
            else
                core.panel.setContent("Goals", action.content, "type-judgement");
            break;
        case 1 /* Error */:
            core.panel.setContent("Error", action.content, "error");
            break;
        case 2 /* TypeChecking */:
            core.panel.setContent("Type Checking", action.content);
            break;
        case 3 /* CurrentGoal */:
            core.panel.setContent("Current Goal", action.content, "value");
            break;
        case 4 /* InferredType */:
            core.panel.setContent("Inferred Type", action.content);
            break;
        case 5 /* ModuleContents */:
            core.panel.setContent("Module Contents", action.content);
            break;
        case 6 /* Context */:
            core.panel.setContent("Context", action.content, "type-judgement");
            break;
        case 7 /* GoalTypeEtc */:
            core.panel.setContent("Goal Type and Context", action.content, "type-judgement");
            break;
        case 8 /* NormalForm */:
            core.panel.setContent("Normal Form", action.content, "value");
            break;
        case 9 /* Intro */:
            core.panel.setContent("Intro", ['No introduction forms found']);
            break;
        case 10 /* Auto */:
            core.panel.setContent("Auto", ['No solution found']);
            break;
        case 11 /* Constraints */:
            core.panel.setContent("Constraints", action.content, "type-judgement");
            break;
        case 12 /* ScopeInfo */:
            core.panel.setContent("Scope Info", action.content);
            break;
        default:
            console.error("unknown info action " + action);
    }
}
