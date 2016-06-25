import * as _ from "lodash";
import { Agda } from "./types";
import Core from "./core";

function handleAgdaResponse(core: Core, response: Agda.Response) {
    switch (response.type) {
        case Agda.ResponseType.InfoAction:
            handleInfoAction(core, <Agda.InfoAction>response);
            break;

        case Agda.ResponseType.StatusAction:
            let status = <Agda.StatusAction>response;
            if (status.content.length !== 0) {
                core.panel.setContent("Status", status.content);
            }
            break;

        case Agda.ResponseType.GoalsAction:
            let goals = (<Agda.GoalsAction>response).content;
            core.textBuffer.onGoalsAction(goals);
            break;

        case Agda.ResponseType.GiveAction:
            let give = <Agda.GiveAction>response;
            core.textBuffer.onGiveAction(give.index, give.content, give.hasParenthesis);
            break;

        case Agda.ResponseType.ParseError:
            console.error(`Agda parse error: ${(<Agda.ParseError>response).content}`);
            break;

        case Agda.ResponseType.Goto:
            let res = <Agda.Goto>response;
            core.textBuffer.onGoto(res.filepath, res.position);
            break;

        case Agda.ResponseType.SolveAllAction:
            const solutions = (<Agda.SolveAllAction>response).solutions;
            solutions.forEach((solution) => {
                core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(core.process.give);
            });
            break;
        case Agda.ResponseType.MakeCaseAction:
            core.textBuffer
                .onMakeCaseAction((<Agda.MakeCaseAction>response).content)
                .then(() => {
                    core.commander.load()
                        .catch((error) => { throw error; });
                });
            break;

        case Agda.ResponseType.MakeCaseActionExtendLam:
            core.textBuffer.onMakeCaseActionExtendLam((<Agda.MakeCaseAction>response).content)
                .then(() => {
                    core.commander.load()
                        .catch((error) => { throw error; });
                });
            break;

        case Agda.ResponseType.HighlightClear:
            core.highlightManager.destroyAll();
            break;

        case Agda.ResponseType.HighlightAddAnnotations:
            let annotations = (<Agda.HighlightAddAnnotations>response).content;
            annotations.forEach((annotation) => {
                let unsolvedmeta = _.includes(annotation.type, "unsolvedmeta");
                let terminationproblem = _.includes(annotation.type, "terminationproblem")
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            });
            break;


        case Agda.ResponseType.HighlightLoadAndDeleteAction:
            // ???
            break;

        case Agda.ResponseType.UnknownAction:
            console.error(`Agda.ResponseType.UnknownAction:`);
            console.error(response);
            break;
        default:
            console.error(`Agda.ResponseType: ${JSON.stringify(response)}`);
    }
}

function handleInfoAction(core: Core, action: Agda.InfoAction)  {
    switch (action.infoActionType) {
        case Agda.InfoActionType.AllGoals:
            if (action.content.length === 0)
                core.panel.setContent("No Goals", []);
            else
                core.panel.setContent("Goals", action.content, "type-judgement");
            break;
        case Agda.InfoActionType.Error:
            core.panel.setContent("Error", action.content, "error");
            break;
        case Agda.InfoActionType.TypeChecking:
            core.panel.setContent("Type Checking", action.content);
            break;
        case Agda.InfoActionType.CurrentGoal:
            core.panel.setContent("Current Goal", action.content, "value");
            break;
        case Agda.InfoActionType.InferredType:
            core.panel.setContent("Inferred Type", action.content);
            break;
        case Agda.InfoActionType.ModuleContents:
            core.panel.setContent("Module Contents", action.content);
            break;
        case Agda.InfoActionType.Context:
            core.panel.setContent("Context", action.content, "type-judgement");
            break;
        case Agda.InfoActionType.GoalTypeEtc:
            core.panel.setContent("Goal Type and Context", action.content, "type-judgement");
            break;
        case Agda.InfoActionType.NormalForm:
            core.panel.setContent("Normal Form", action.content, "value");
            break;
        case Agda.InfoActionType.Intro:
            core.panel.setContent("Intro", ['No introduction forms found']);
            break;
        case Agda.InfoActionType.Auto:
            core.panel.setContent("Auto", ['No solution found']);
            break;
        case Agda.InfoActionType.Constraints:
            core.panel.setContent("Constraints", action.content, "type-judgement");
            break;
        case Agda.InfoActionType.ScopeInfo:
            core.panel.setContent("Scope Info", action.content);
            break;
        default:
            console.error(`unknown info action ${action}`);
    }
}

export {
    handleAgdaResponse
}
