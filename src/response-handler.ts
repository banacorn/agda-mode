import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';
import { Agda, View } from './type';
import * as Req from './request';
import Core from './core';
import * as Action from './view/actions';
import { parseSExpression, parseAnnotation, parseJudgements, parseError } from './parser';
import { OutOfGoalError, EmptyGoalError, QueryCancelled, NotLoadedError, InvalidExecutablePathError } from './error';
import { ConnectionNotEstablished, ConnectionError } from './connector';


const handleResponses = (core: Core) => (responses: Agda.Response[]): Promise<void> => {
    return Promise.each(responses, handleResponse(core))
        .then(() => {})
        .catch(ConnectionError, error => {
            this.core.view.store.dispatch(Action.CONNECTION.err(error.guid));
            this.core.view.set(error.name, error.message.split('\n'), View.Style.Error);
        })
        .catch(ConnectionNotEstablished, () => {
            this.core.view.set('Connection to Agda not established', [], View.Style.Warning);
        })
        .catch(QueryCancelled, () => {
            this.core.view.set('Query cancelled', [], View.Style.Warning);
        })
        .catch((error) => { // catch all the rest
            if (error) {
                console.log(error)
                switch (error.name) {
                    case 'InvalidExecutablePathError':
                    this.core.view.set(error.message, [error.path], View.Style.Error);
                    break;
                default:
                    this.core.view.set(error.name, error.message.split('\n'), View.Style.Error);
                }
            } else {
                this.core.view.set('Panic!', ['unknown error'], View.Style.Error);
            }
        });
}

const handleResponse = (core: Core) => (response: Agda.Response): Promise<void> => {
    // console.log(response.kind)
    switch (response.kind) {
        case 'HighlightingInfo_Direct':
            const annotations = response.annotations;
            return Promise.each(annotations, (annotation) => {
                let unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                let terminationproblem = _.includes(annotation.type, 'terminationproblem')
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            }).then(() => {});

        case 'HighlightingInfo_Indirect':
            return Promise.promisify(fs.readFile)(response.filepath)
                .then(data => {
                    const annotations = parseSExpression(data.toString()).map(parseAnnotation);
                    annotations.forEach((annotation) => {
                        let unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                        let terminationproblem = _.includes(annotation.type, 'terminationproblem')
                        if (unsolvedmeta || terminationproblem) {
                            core.highlightManager.highlight(annotation);
                        }
                    });
                })
        case 'Status':
            if (response.checked || response.showImplicit) {
                core.view.set('Status', [`Typechecked: ${response.checked}`, `Display implicit arguments: ${response.showImplicit}`]);
            }
            return Promise.resolve();

        case 'JumpToError':
            return core.textBuffer.onJumpToError(response.filepath, response.position);

        case 'InteractionPoints':
            return core.textBuffer.onInteractionPoints(response.indices);

        case 'InfoAction':
            handleInfoAction(core, response);
            return Promise.resolve();

        case 'GiveAction':
            return core.textBuffer.onGiveAction(response.index, response.giveResult, response.result);

        case 'SolveAllAction':
            return Promise.each(response.solutions, (solution) => {
                return core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(goal => core.connector
                        .getConnection()
                        .then(Req.give(goal))
                        .then(handleResponses(core))
                    )
            }).then(() => {});

        case 'MakeCaseAction':
            return core.textBuffer
                .onMakeCaseAction(response.content)
                .then(() => core.commander.dispatch({ kind: 'Load' }))

        case 'MakeCaseActionExtendLam':
            return core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(() => core.commander.dispatch({ kind: 'Load' }))

        case 'HighlightClear':
            return core.highlightManager.destroyAll();

        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
            return Promise.resolve();
    }
}

function handleInfoAction(core: Core, response: Agda.InfoAction)  {
    switch (response.infoActionKind) {
        case 'AllGoals':
            if (response.content.length === 0) {
                core.view.set('All Done', [], View.Style.Success);

            } else {
                core.view.setJudgements('Goals', parseJudgements(response.content));
            }
            break;
        case 'Error':
            // core.commander.pendingQueue.reject();

            const error = parseError(response.content.join('\n'));
            core.view.setError(error);

            break;
        case 'TypeChecking':
            core.view.set('Type Checking', response.content);
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', response.content, View.Style.Info);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', response.content, View.Style.Info);
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', response.content, View.Style.Info);
            break;
        case 'Context':
            core.view.setJudgements('Context', parseJudgements(response.content));
            break;
        case 'GoalTypeEtc':
            core.view.setJudgements('Goal Type and Context', parseJudgements(response.content));
            break;
        case 'NormalForm':
            core.view.set('Normal Form', response.content, View.Style.Info);
            break;
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Auto':
            core.view.set('Auto', ['No solution found'], View.Style.Info);
            break;
        case 'Constraints':
            core.view.set('Constraints', response.content, View.Style.Info);
            break;
        case 'ScopeInfo':
            core.view.set('Scope Info', response.content, View.Style.Info);
            break;
        case 'Unknown':
            core.view.set(_.head(response.content) || 'UNKNOWN INFO ACTION FROM AGDA', _.tail(response.content), View.Style.Warning);
            break;
        default:
            console.error(`unknown info response:`);
            console.error(response);
    }
}

export {
    handleResponses
}
