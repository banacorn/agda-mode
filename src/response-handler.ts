import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';
import { Agda, View } from './type';
import * as Req from './request';
import { Core } from './core';
import * as Action from './view/actions';
import { parseSExpression, parseAnnotation, parseJudgements, parseError, parseSolutions } from './parser';
import * as Err from './error';

const handleResponses = (core: Core) => (responses: Agda.Response[]): Promise<void> => {
    return Promise.each(responses, handleResponse(core))
        .then(() => {})
        .catch(Err.Conn.NotEstablished, error => {
            core.view.set('Connection to Agda not established', [], View.Style.Warning);
        })
        .catch(Err.Conn.Connection, error => {
                core.view.set(error.name, error.message.split('\n'), View.Style.Error);
                core.view.store.dispatch(Action.CONNECTION.err(error.guid));
        })
        .catch(Err.QueryCancelled, () => {
            core.view.set('Query cancelled', [], View.Style.Warning);
        })
        .catch((error) => { // catch all the rest
            if (error) {
                console.log(error)
                switch (error.name) {
                    case 'Err.InvalidExecutablePathError':
                    core.view.set(error.message, [error.path], View.Style.Error);
                    break;
                default:
                    core.view.set(error.name, error.message.split('\n'), View.Style.Error);
                }
            } else {
                core.view.set('Panic!', ['unknown error'], View.Style.Error);
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
                    core.editor.highlighting.add(annotation);
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
                            core.editor.highlighting.add(annotation);
                        }
                    });
                })
        case 'Status':
            if (response.checked || response.showImplicit) {
                core.view.set('Status', [`Typechecked: ${response.checked}`, `Display implicit arguments: ${response.showImplicit}`]);
            }
            return Promise.resolve();

        case 'JumpToError':
            return core.editor.onJumpToError(response.filepath, response.position);

        case 'InteractionPoints':
            return core.editor.onInteractionPoints(response.indices);

        case 'GiveAction':
            return core.editor.onGiveAction(response.index, response.giveResult, response.result);

        case 'MakeCase':
            return core.editor
                .onMakeCase(response.variant, response.result)
                .then(() => core.commander.dispatch({ kind: 'Load' }))

        case 'SolveAll':
            return Promise.each(response.solutions, (solution) => {
                return core.editor.onSolveAll(solution.index, solution.expression)
                    .then(goal => core.connection
                        .getConnection()
                        .then(Req.give(goal))
                        .then(handleResponses(core))
                    )
            }).then(() => {});

        case 'DisplayInfo':
            handleDisplayInfo(core, response);
            return Promise.resolve();


        case 'HighlightClear':
            return core.editor.highlighting.destroyAll();

        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
            return Promise.resolve();
    }
}

function handleDisplayInfo(core: Core, response: Agda.DisplayInfo)  {
    switch (response.displayInfoKind) {
        case 'CompilationOk':
        case 'Constraints':
            core.view.set('Constraints', response.content, View.Style.Info);
            break;
        case 'AllGoalsWarnings':
            if (response.content.length === 0) {
                core.view.set('All Done', [], View.Style.Success);
            } else {
                // remove the astericks
                const title = response.title.slice(1, -1);
                core.view.setJudgements(title, parseJudgements(response.content));
            }
            break;
        case 'Auto':
            let solutions = parseSolutions(response.content);
            core.view.setSolutions(solutions);
            break;
        case 'Error':
            const error = parseError(response.content.join('\n'));
            core.view.setAgdaError(error);
            break;
        case 'NormalForm':
            core.view.set('Normal Form', response.content, View.Style.Info);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', response.content, View.Style.Info);
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', response.content, View.Style.Info);
            break;
        case 'GoalType':
            core.view.setJudgements('Goal Type and Context', parseJudgements(response.content));
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', response.content, View.Style.Info);
            break;
        case 'WhyInScope':
            core.view.set('Scope Info', response.content, View.Style.Info);
            break;
        case 'Context':
            core.view.setJudgements('Context', parseJudgements(response.content));
            break;
        case 'HelperFunction':
        case 'SearchAbout':
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Version':
        default:
            core.view.set(response.title, response.content, View.Style.PlainText);
            break;
    }
}

export {
    handleResponses
}
