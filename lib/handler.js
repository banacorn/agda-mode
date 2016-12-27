"use strict";
var _ = require("lodash");
var fs = require("fs");
var parser_1 = require("./parser");
function handleAgdaResponse(core, response) {
    switch (response.kind) {
        case 'InfoAction':
            handleInfoAction(core, response);
            break;
        case 'StatusAction':
            if (response.content.length !== 0) {
                core.view.set('Status', response.content);
            }
            break;
        case 'GoalsAction':
            core.commander.pendingQueue.resolve();
            core.textBuffer.onGoalsAction(response.content);
            break;
        case 'GiveAction':
            core.textBuffer.onGiveAction(response.index, response.content, response.hasParenthesis);
            break;
        case 'ParseError':
            core.commander.pendingQueue.reject();
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
            fs.readFile(response.content, function (err, data) {
                var annotations = parser_1.parseSExpression(data.toString()).map(parser_1.parseAnnotation);
                annotations.forEach(function (annotation) {
                    var unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                    var terminationproblem = _.includes(annotation.type, 'terminationproblem');
                    if (unsolvedmeta || terminationproblem) {
                        core.highlightManager.highlight(annotation);
                    }
                });
            });
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
            if (action.content.length === 0) {
                core.view.set('All Done', [], 2 /* Success */);
            }
            else {
                core.view.setJudgements('Goals', parser_1.parseJudgements(action.content));
            }
            break;
        case 'Error':
            core.commander.pendingQueue.reject();
            var error = parser_1.parseError(action.content.join('\n'));
            core.view.setError(error);
            break;
        case 'TypeChecking':
            core.view.set('Type Checking', action.content);
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', action.content, 1 /* Info */);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', action.content, 1 /* Info */);
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', action.content, 1 /* Info */);
            break;
        case 'Context':
            core.view.setJudgements('Context', parser_1.parseJudgements(action.content));
            break;
        case 'GoalTypeEtc':
            core.view.setJudgements('Goal Type and Context', parser_1.parseJudgements(action.content));
            break;
        case 'NormalForm':
            core.view.set('Normal Form', action.content, 1 /* Info */);
            break;
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Auto':
            core.view.set('Auto', ['No solution found'], 1 /* Info */);
            break;
        case 'Constraints':
            core.view.set('Constraints', action.content, 1 /* Info */);
            break;
        case 'ScopeInfo':
            core.view.set('Scope Info', action.content, 1 /* Info */);
            break;
        case 'Unknown':
            core.view.set(_.head(action.content) || 'UNKNOWN INFO ACTION FROM AGDA', _.tail(action.content), 4 /* Warning */);
            break;
        default:
            console.error("unknown info action:");
            console.error(action);
    }
}
//# sourceMappingURL=handler.js.map