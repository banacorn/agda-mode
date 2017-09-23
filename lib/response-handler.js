"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const fs = require("fs");
const Req = require("./request");
const Action = require("./view/actions");
const parser_1 = require("./parser");
const error_1 = require("./error");
const connector_1 = require("./connector");
const handleResponses = (core) => (responses) => {
    return Promise.each(responses, handleResponse(core))
        .then(() => { })
        .catch(connector_1.ConnectionError, error => {
        this.core.view.store.dispatch(Action.CONNECTION.err(error.guid));
        this.core.view.set(error.name, error.message.split('\n'), 3 /* Error */);
    })
        .catch(connector_1.ConnectionNotEstablished, () => {
        this.core.view.set('Connection to Agda not established', [], 4 /* Warning */);
    })
        .catch(error_1.QueryCancelled, () => {
        this.core.view.set('Query cancelled', [], 4 /* Warning */);
    })
        .catch((error) => {
        if (error) {
            console.log(error);
            switch (error.name) {
                case 'InvalidExecutablePathError':
                    this.core.view.set(error.message, [error.path], 3 /* Error */);
                    break;
                default:
                    this.core.view.set(error.name, error.message.split('\n'), 3 /* Error */);
            }
        }
        else {
            this.core.view.set('Panic!', ['unknown error'], 3 /* Error */);
        }
    });
};
exports.handleResponses = handleResponses;
const handleResponse = (core) => (response) => {
    // console.log(response.kind)
    switch (response.kind) {
        case 'HighlightingInfo_Direct':
            const annotations = response.annotations;
            return Promise.each(annotations, (annotation) => {
                let unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                let terminationproblem = _.includes(annotation.type, 'terminationproblem');
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            }).then(() => { });
        case 'HighlightingInfo_Indirect':
            return Promise.promisify(fs.readFile)(response.filepath)
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
        case 'Status':
            if (response.checked || response.showImplicit) {
                core.view.set('Status', [`Typechecked: ${response.checked}`, `Display implicit arguments: ${response.showImplicit}`]);
            }
            return Promise.resolve();
        case 'JumpToError':
            return core.textBuffer.onJumpToError(response.filepath, response.position);
        case 'InfoAction':
            handleInfoAction(core, response);
            return Promise.resolve();
        case 'GoalsAction':
            return core.textBuffer.onGoalsAction(response.content);
        case 'GiveAction':
            return core.textBuffer.onGiveAction(response.index, response.content, response.hasParenthesis);
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
                .then(() => core.commander.dispatch({ kind: 'Load' }));
        case 'MakeCaseActionExtendLam':
            return core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(() => core.commander.dispatch({ kind: 'Load' }));
        case 'HighlightClear':
            return core.highlightManager.destroyAll();
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
//# sourceMappingURL=response-handler.js.map