"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const fs = require("fs");
const Req = require("./request");
const parser_1 = require("./parser");
function handleAgdaResponse(core, response) {
    switch (response.kind) {
        case 'InfoAction':
            handleInfoAction(core, response);
            return Promise.resolve();
        case 'StatusAction':
            if (response.content.length !== 0) {
                core.view.set('Status', response.content);
            }
            return Promise.resolve();
        case 'GoalsAction':
            return core.textBuffer.onGoalsAction(response.content);
        case 'GiveAction':
            return core.textBuffer.onGiveAction(response.index, response.content, response.hasParenthesis);
        case 'ParseError':
            console.error(`Agda parse error: ${response.content}`);
            return Promise.resolve();
        case 'Goto':
            return core.textBuffer.onGoto(response.filepath, response.position);
        case 'SolveAllAction':
            return Promise.each(response.solutions, (solution) => {
                return core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(goal => core.connector
                    .getConnection()
                    .then(Req.give(goal)));
            });
        case 'MakeCaseAction':
            return core.textBuffer
                .onMakeCaseAction(response.content)
                .then(core.commander.load);
        case 'MakeCaseActionExtendLam':
            return core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(core.commander.load);
        case 'HighlightClear':
            return core.highlightManager.destroyAll();
        case 'HighlightAddAnnotations':
            const annotations = response.content;
            return Promise.each(annotations, (annotation) => {
                let unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                let terminationproblem = _.includes(annotation.type, 'terminationproblem');
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            });
        case 'HighlightLoadAndDeleteAction':
            return Promise.promisify(fs.readFile)(response.content)
                .then(data => {
                const annotations = parser_1.parseSExpression(data.toString()).map(parser_1.parseAnnotation);
                annotations.forEach((annotation) => {
                    let unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                    let terminationproblem = _.includes(annotation.type, 'terminationproblem');
                    if (unsolvedmeta || terminationproblem) {
                        core.highlightManager.highlight(annotation);
                    }
                });
            });
        case 'UnknownAction':
            console.error(`'UnknownAction:`);
            console.error(response);
            return Promise.resolve();
        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
            return Promise.resolve();
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
            // core.commander.pendingQueue.reject();
            const error = parser_1.parseError(action.content.join('\n'));
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
            console.error(`unknown info action:`);
            console.error(action);
    }
}
//# sourceMappingURL=handler.js.map