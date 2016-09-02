import * as _ from 'lodash';
import { Agda, View } from './types';
import Core from './core';

function handleAgdaResponse(core: Core, response: Agda.Response) {
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
            core.textBuffer.onGoalsAction(response.content);
            break;

        case 'GiveAction':
            core.textBuffer.onGiveAction(response.index, response.content, response.hasParenthesis);
            break;

        case 'ParseError':
            console.error(`Agda parse error: ${response.content}`);
            break;

        case 'Goto':
            core.textBuffer.onGoto(response.filepath, response.position);
            break;

        case 'SolveAllAction':
            const solutions = response.solutions;
            solutions.forEach((solution) => {
                core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(core.process.give);
            });
            break;
        case 'MakeCaseAction':
            core.textBuffer
                .onMakeCaseAction(response.content)
                .then(() => {
                    core.commander.load()
                        .catch((error) => { throw error; });
                });
            break;

        case 'MakeCaseActionExtendLam':
            core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(() => {
                    core.commander.load()
                        .catch((error) => { throw error; });
                });
            break;

        case 'HighlightClear':
            core.highlightManager.destroyAll();
            break;

        case 'HighlightAddAnnotations':
            let annotations = response.content;
            annotations.forEach((annotation) => {
                let unsolvedmeta = _.includes(annotation.type, 'unsolvedmeta');
                let terminationproblem = _.includes(annotation.type, 'terminationproblem')
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            });
            break;


        case 'HighlightLoadAndDeleteAction':
            // ???
            break;

        case 'UnknownAction':
            console.error(`'UnknownAction:`);
            console.error(response);
            break;
        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
    }
}

function handleInfoAction(core: Core, action: Agda.InfoAction)  {
    switch (action.infoActionKind) {
        case 'AllGoals':
            if (action.content.length === 0)
                core.view.set('No Goals', []);
            else
                core.view.set('Goals', action.content, View.Style.Judgement);
            break;
        case 'Error':
            core.view.set('Error', action.content, View.Style.Error);
            break;
        case 'TypeChecking':
            core.view.set('Type Checking', action.content);
            break;
        case 'CurrentGoal':
            core.view.set('Current Goal', action.content, View.Style.Value);
            break;
        case 'InferredType':
            core.view.set('Inferred Type', action.content);
            break;
        case 'ModuleContents':
            core.view.set('Module Contents', action.content);
            break;
        case 'Context':
            core.view.set('Context', action.content, View.Style.Judgement);
            break;
        case 'GoalTypeEtc':
            core.view.set('Goal Type and Context', action.content, View.Style.Judgement);
            break;
        case 'NormalForm':
            core.view.set('Normal Form', action.content, View.Style.Value);
            break;
        case 'Intro':
            core.view.set('Intro', ['No introduction forms found']);
            break;
        case 'Auto':
            core.view.set('Auto', ['No solution found']);
            break;
        case 'Constraints':
            core.view.set('Constraints', action.content, View.Style.Judgement);
            break;
        case 'ScopeInfo':
            core.view.set('Scope Info', action.content);
            break;
        case 'Unknown':
            core.view.set(_.head(action.content), _.tail(action.content));
            break;
        default:
            console.error(`unknown info action:`);
            console.error(action);
    }
}

export {
    handleAgdaResponse
}
