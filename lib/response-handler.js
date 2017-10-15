"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const fs = require("fs");
const Req = require("./request");
const Action = require("./view/actions");
const parser_1 = require("./parser");
const Err = require("./error");
const handleResponses = (core) => (responses) => {
    return Promise.each(responses, handleResponse(core))
        .then(() => { })
        .catch(Err.Conn.NotEstablished, error => {
        core.view.set('Connection to Agda not established', [], 4 /* Warning */);
    })
        .catch(Err.Conn.Connection, error => {
        core.view.set(error.name, error.message.split('\n'), 3 /* Error */);
        core.view.store.dispatch(Action.CONNECTION.err(error.guid));
    })
        .catch(Err.QueryCancelled, () => {
        core.view.set('Query cancelled', [], 4 /* Warning */);
    })
        .catch((error) => {
        if (error) {
            console.log(error);
            switch (error.name) {
                case 'Err.InvalidExecutablePathError':
                    core.view.set(error.message, [error.path], 3 /* Error */);
                    break;
                default:
                    core.view.set(error.name, error.message.split('\n'), 3 /* Error */);
            }
        }
        else {
            core.view.set('Panic!', ['unknown error'], 3 /* Error */);
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
        case 'InteractionPoints':
            return core.textBuffer.onInteractionPoints(response.indices);
        case 'GiveAction':
            return core.textBuffer.onGiveAction(response.index, response.giveResult, response.result);
        case 'MakeCase':
            return core.textBuffer
                .onMakeCase(response.variant, response.result)
                .then(() => core.commander.dispatch({ kind: 'Load' }));
        case 'SolveAll':
            return Promise.each(response.solutions, (solution) => {
                return core.textBuffer.onSolveAll(solution.index, solution.expression)
                    .then(goal => core.connection
                    .getConnection()
                    .then(Req.give(goal))
                    .then(handleResponses(core)));
            }).then(() => { });
        case 'DisplayInfo':
            handleDisplayInfo(core, response);
            return Promise.resolve();
        case 'HighlightClear':
            return core.highlightManager.destroyAll();
        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
            return Promise.resolve();
    }
};
function handleDisplayInfo(core, response) {
    switch (response.displayInfoKind) {
        case 'CompilationOk':
        case 'Constraints':
            core.view.set('Constraints', response.content, 1 /* Info */);
            break;
        case 'AllGoalsWarnings':
            if (response.content.length === 0) {
                core.view.set('All Done', [], 2 /* Success */);
            }
            else {
                // remove the astericks
                const title = response.title.slice(1, -1);
                core.view.setJudgements(title, parser_1.parseJudgements(response.content));
            }
            break;
        case 'Auto':
            let solutions = parser_1.parseSolutions(response.content);
            core.view.setSolutions(solutions);
            break;
        case 'Error':
            const error = parser_1.parseError(response.content.join('\n'));
            core.view.setAgdaError(error);
            break;
        case 'NormalForm':
            core.view.set('Normal Form', response.content, 1 /* Info */);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', response.content, 1 /* Info */);
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', response.content, 1 /* Info */);
            break;
        case 'GoalType':
            core.view.setJudgements('Goal Type and Context', parser_1.parseJudgements(response.content));
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', response.content, 1 /* Info */);
            break;
        case 'WhyInScope':
            core.view.set('Scope Info', response.content, 1 /* Info */);
            break;
        case 'Context':
            core.view.setJudgements('Context', parser_1.parseJudgements(response.content));
            break;
        case 'HelperFunction':
        case 'SearchAbout':
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Version':
        default:
            core.view.set(response.title, response.content, 0 /* PlainText */);
            break;
    }
}
//# sourceMappingURL=response-handler.js.map