"use strict";
function handleAgdaResponse(core, response) {
    switch (response.type) {
        case 0:
            handleInfoAction(core, response);
            break;
        case 1:
            core.panel.setContent("Status", response.content);
            break;
        case 2:
            var goals = response.content;
            core.textBuffer.onGoalsAction(goals);
            break;
        case 3:
            var give = response;
            core.textBuffer.onGiveAction(give.index, give.content, give.hasParenthesis);
            break;
        case 4:
            console.error("Agda parse error: " + response.content);
            break;
        case 5:
            var res = response;
            core.textBuffer.onGoto(res.filepath, res.position);
            break;
        case 6:
            core.textBuffer
                .onSolveAllAction(response.solution[0], response.solution[1])
                .then(function (goal) {
                return core.process.give(goal);
            });
            break;
        case 7:
            core.textBuffer.onMakeCaseAction(response)
                .then(function () {
                core.commander.load()
                    .catch(function () { });
            });
            break;
        case 8:
            core.textBuffer.onMakeCaseActionExtendLam(response)
                .then(function () {
                core.commander.load()
                    .catch(function () { });
            });
            break;
        case 9:
            core.highlight.destroy();
            break;
        case 10:
            var annotations = response.content;
            annotations.forEach(function (annotation) {
                var unsolvedmeta = _.includes(annotation.type, "unsolvedmeta");
                var terminationproblem = _.includes(annotation.type, "terminationproblem");
                if (unsolvedmeta || terminationproblem) {
                    core.highlight.highlight(annotation);
                }
            });
            break;
        case 11:
            break;
        case 12:
            console.error("Agda.ResponseType.UnknownAction: " + response);
            break;
        default:
            console.error("Agda.ResponseType: " + JSON.stringify(response));
    }
}
exports.handleAgdaResponse = handleAgdaResponse;
function handleInfoAction(core, action) {
    switch (action.infoActionType) {
        case 0:
            if (action.content.length === 0)
                core.panel.setContent("No Goals", []);
            else
                core.panel.setContent("Goals", action.content, "type-judgement");
            break;
        case 1:
            core.panel.setContent("Error", action.content, "error");
            break;
        case 2:
            core.panel.setContent("Type Checking", action.content);
            break;
        case 3:
            core.panel.setContent("Current Goal", action.content, "value");
            break;
        case 4:
            core.panel.setContent("Inferred Type", action.content);
            break;
        case 5:
            core.panel.setContent("Module Contents", action.content);
            break;
        case 6:
            core.panel.setContent("Context", action.content, "type-judgement");
            break;
        case 7:
            core.panel.setContent("Goal Type and Context", action.content, "type-judgement");
            break;
        case 8:
            core.panel.setContent("Normal Form", action.content, "value");
            break;
        case 9:
            core.panel.setContent("Intro", ['No introduction forms found']);
            break;
        case 10:
            core.panel.setContent("Auto", ['No solution found']);
            break;
        case 11:
            core.panel.setContent("Constraints", action.content, "type-judgement");
            break;
        case 12:
            core.panel.setContent("Scope Info", action.content);
            break;
        default:
            console.error("unknown info action " + action);
    }
}
