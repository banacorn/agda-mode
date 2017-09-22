"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const fs = require("fs");
const Req = require("./request");
const parser_1 = require("./parser");
const handleResponses = (core) => (responses) => {
    return Promise.each(responses, handleResponse(core))
        .then(() => { });
};
exports.handleResponses = handleResponses;
const handleResponse = (core) => (response) => {
    // console.log(response.kind)
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
        case 'Goto':
            return core.textBuffer.onGoto(response.filepath, response.position);
        case 'SolveAllAction':
            return Promise.each(response.solutions, (solution) => {
                return core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(goal => core.connector
                    .getConnection()
                    .then(Req.give(goal))
                    .then(handleResponses(core)));
            }).then(() => { });
        case 'MakeCaseAction':
            return core.textBuffer
                .onMakeCaseAction(response.content)
                .then(() => core.connector
                .getConnection()
                .then(Req.load)
                .then(handleResponses(core)))
                .then(() => { });
        case 'MakeCaseActionExtendLam':
            return core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(() => core.connector
                .getConnection()
                .then(Req.load)
                .then(handleResponses(core)))
                .then(() => { });
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
            }).then(() => { });
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
        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
            return Promise.resolve();
    }
};
function handleInfoAction(core, response) {
    switch (response.infoActionKind) {
        case 'AllGoals':
            if (response.content.length === 0) {
                core.view.set('All Done', [], 2 /* Success */);
            }
            else {
                core.view.setJudgements('Goals', parser_1.parseJudgements(response.content));
            }
            break;
        case 'Error':
            // core.commander.pendingQueue.reject();
            const error = parser_1.parseError(response.content.join('\n'));
            core.view.setError(error);
            break;
        case 'TypeChecking':
            core.view.set('Type Checking', response.content);
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', response.content, 1 /* Info */);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', response.content, 1 /* Info */);
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', response.content, 1 /* Info */);
            break;
        case 'Context':
            core.view.setJudgements('Context', parser_1.parseJudgements(response.content));
            break;
        case 'GoalTypeEtc':
            core.view.setJudgements('Goal Type and Context', parser_1.parseJudgements(response.content));
            break;
        case 'NormalForm':
            core.view.set('Normal Form', response.content, 1 /* Info */);
            break;
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Auto':
            core.view.set('Auto', ['No solution found'], 1 /* Info */);
            break;
        case 'Constraints':
            core.view.set('Constraints', response.content, 1 /* Info */);
            break;
        case 'ScopeInfo':
            core.view.set('Scope Info', response.content, 1 /* Info */);
            break;
        case 'Unknown':
            core.view.set(_.head(response.content) || 'UNKNOWN INFO ACTION FROM AGDA', _.tail(response.content), 4 /* Warning */);
            break;
        default:
            console.error(`unknown info response:`);
            console.error(response);
    }
}
//# sourceMappingURL=handler.js.map