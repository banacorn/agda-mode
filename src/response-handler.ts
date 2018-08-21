import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';
import { Agda, View } from './type';
import * as Req from './request';
import { Core } from './core';
import * as J from './parser/json';
import * as Emacs from './parser/emacs';
import * as Err from './error';

// classify responses into async and sync ones
// don't deal everything with promises
// for the nasty issue of https://github.com/petkaantonov/bluebird/issues/1326
const handleResponses = (core: Core) => (responses: Agda.Response[]): Promise<void> => {

    var promises = []; // async actions

    responses.forEach(response => {
        var promise = handleResponse(core)(response);
        if (promise) {
            promises.push(promise);
        }
    });

    return Promise.each(promises, a => a)
        .then(() => {})
        .catch(Err.Conn.NotEstablished, () => {
            core.view.set('Connection to Agda not established', [], View.Style.Warning);
        })
        .catch(Err.Conn.ConnectionError, error => {
                core.view.set(error.name, error.message.split('\n'), View.Style.Error);
                // core.view.store.dispatch(Action.CONNECTION.err(error.guid));
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

const handleResponse = (core: Core) => (response: Agda.Response): Promise<void> | null => {
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
                    const annotations = core.connection.usesJSON()
                        ? J.parseIndirectAnnotations(data.toString())
                        : Emacs.parseSExpression(data.toString()).map(Emacs.parseAnnotation)
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
            return null;

        case 'JumpToError':
            return core.editor.onJumpToError(response.filepath, response.position);

        case 'InteractionPoints':
            return core.editor.onInteractionPoints(response.indices, response.fileType);

        case 'GiveAction':
            return core.editor.onGiveAction(response.index, response.giveResult, response.result);

        case 'MakeCase':
            return core.editor
                .onMakeCase(response.variant, response.result)
                .then(() => core.commander.dispatch({ kind: 'Load' }))

        case 'SolveAll':
            return Promise.each(response.solutions, (solution) => {
                return core.editor.onSolveAll(solution.index, solution.expression)
                    .then(goal => {
                        console.log(goal.index)
                        return  core.connection.getConnection()
                                .then(connection => [Req.give(goal)({ kind: 'Give' }, connection)])
                                .then(core.commander.sendRequests)
                                .then(handleResponses(core))
                    })
            }).then(() => {});

        case 'DisplayInfo':
            if (core.connection.usesJSON())
                handleJSONDisplayInfo(core, response.info);
            else
                handleEmacsDisplayInfo(core, response.info);

            return null;

        case 'RunningInfo':
            core.editor.runningInfo.add(response.message)
            return null;

        case 'ClearRunningInfo':
            core.editor.runningInfo.clear();
            return null;

        case 'HighlightClear':
            return core.editor.highlighting.destroyAll();

        case 'DoneAborting':
            core.view.set('Status', [`Done aborting`], View.Style.Warning);
            return null;

        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
            return null;
    }
}

function handleEmacsDisplayInfo(core: Core, response: Agda.Info)  {
    switch (response.kind) {
        case 'CompilationOk':
            core.view.set('CompilationOk', response.mixed, View.Style.Info);
            break;
        case 'Constraints':
            core.view.set('Constraints', response.constraints, View.Style.Info);
            break;
        case 'AllGoalsWarnings':
            const body = Emacs.parseJudgements(response.mixed);
            const hasGoals = (body.goalAndHave.length +
                body.goals.length +
                body.judgements.length +
                body.metas.length +
                body.judgements.length +
                body.sorts.length) > 0;
            const hasWarnings = body.warnings.length > 0;
            const hasErrors = body.errors.length > 0;
            const allDone = response.mixed.length === 0;
            var titleList = [];
            if (hasGoals) titleList = _.concat(titleList, ' Goals')
            if (hasWarnings) titleList = _.concat(titleList, ' Warnings')
            if (hasErrors) titleList = _.concat(titleList, ' Errors')
            const title = allDone ? 'All Done' : 'All ' + titleList.join(',');
            core.view.setJudgements(title, body);
            break;
        case 'Error':
            const error = Emacs.parseError(response.payload.join('\n'));
            core.view.setAgdaError(error);
            break;
        case 'Auto':
            let solutions = Emacs.parseSolutions(response.payload);
            core.view.setSolutions(solutions);
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', response.payload, View.Style.Info);
            break;
        case 'WhyInScope':
            if (core.commander.currentCommand.kind === "GotoDefinition") {
                const result = Emacs.parseWhyInScope(response.payload);
                if (result) {
                    core.editor.jumpToLocation(result.location);
                } else {
                    core.view.set('Go to Definition', ['not in scope'], View.Style.Info);
                }
            } else {
                core.view.set('Scope Info', response.payload, View.Style.Info);
            }
            break;
        case 'NormalForm':
            core.view.set('Normal Form', response.payload, View.Style.Info);
            break;
        case 'GoalType':
            core.view.setJudgements('Goal Type and Context', Emacs.parseJudgements(response.payload));
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', response.payload, View.Style.Info);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', response.payload, View.Style.Info);
            break;
        case 'Context':
            core.view.setJudgements('Context', Emacs.parseJudgements(response.payload));
            break;
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Time':
        case 'SearchAbout':
        case 'HelperFunction':
            core.view.set(response.kind, response.payload);
        case 'Version':
            core.view.set(response.kind, []);
    }
}

function handleJSONDisplayInfo(core: Core, response: Agda.Info)  {
    switch (response.kind) {
        case 'CompilationOk':
            core.view.set('CompilationOk', ['TBD'], View.Style.Warning);
            break;
        case 'Constraints':
            core.view.set('Constraints', ['TBD'], View.Style.Warning);
            break;
        case 'AllGoalsWarnings':
            core.view.set('AllGoalsWarnings', ['TBD'], View.Style.Warning);

            //
            // if (response.content.length === 0) {
            //     core.view.set('All Done', [], View.Style.Success);
            // } else {
            //     // remove the astericks
            //     const title = response.title.slice(1, -1);
            //     core.view.setJudgements(title, Emacs.parseJudgements(response.content));
            // }
            // core.view.setAgdaError(Emacs.parseError(response.content.join('\n')), true);
            // core.view.setAgdaError(Emacs.parseError(response.content.join('\n')), true);
            break;
        case 'Time':
        case 'Error':
        case 'Intro':
        case 'Auto':
        case 'ModuleContents':
        case 'SearchAbout':
        case 'WhyInScope':
        case 'NormalForm':
        case 'GoalType':
        case 'CurrentGoal':
        case 'InferredType':
        case 'Context':
        case 'HelperFunction':
            core.view.set(response.kind, ['TBD'], View.Style.Warning);
            break;
        //     break;
        // case 'AllErrors':
        //     break;
        // case 'Time':
        //     break;
        // case 'Error':
        //     const error = Emacs.parseError(response.content.join('\n'));
        //     core.view.setAgdaError(error);
        //     break;
        // case 'Intro':
        //     core.view.set('Intro', ['No introduction forms found']);
        //     break;
        // case 'Auto':
        //     let solutions = Emacs.parseSolutions(response.content);
        //     core.view.setSolutions(solutions);
        //     break;
        // case 'ModuleContents':
        //     core.view.set('Module Contents', response.content, View.Style.Info);
        //     break;
        // case 'SearchAbout':
        //     break;
        // case 'WhyInScope':
        //     if (core.commander.currentCommand.kind === "GotoDefinition") {
        //         const result = Emacs.parseWhyInScope(response.content);
        //         if (result) {
        //             core.editor.jumpToLocation(result.location);
        //         } else {
        //             core.view.set('Go to Definition', ['not in scope'], View.Style.Info);
        //         }
        //     } else {
        //         core.view.set('Scope Info', response.content, View.Style.Info);
        //     }
        //     break;
        // case 'NormalForm':
        //     core.view.set('Normal Form', response.content, View.Style.Info);
        //     break;
        // case 'GoalType':
        //     core.view.setJudgements('Goal Type and Context', Emacs.parseJudgements(response.content));
        //     break;
        // case 'CurrentGoal':
        //     core.view.set('Current Goal', response.content, View.Style.Info);
        //     break;
        // case 'InferredType':
        //     core.view.set('Inferred Type', response.content, View.Style.Info);
        //     break;
        // case 'Context':
        //     core.view.setJudgements('Context', Emacs.parseJudgements(response.content));
        //     break;
        // case 'HelperFunction':
        //     break;
        case 'Version':
            break;
    }
}

export {
    handleResponses
}
