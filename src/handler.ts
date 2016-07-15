import * as _ from "lodash";
import { Agda, View } from "./types";
import Core from "./core";

function handleAgdaResponse(core: Core, response: Agda.Response) {
    switch (response.kind) {
        case "InfoAction":
            handleInfoAction(core, response);
            break;

        case "StatusAction":
            if (response.content.length !== 0) {
                core.view.set("Status", response.content);
            }
            break;

        case "GoalsAction":
            core.textBuffer.onGoalsAction(response.content);
            break;

        case "GiveAction":
            core.textBuffer.onGiveAction(response.index, response.content, response.hasParenthesis);
            break;

        case "ParseError":
            console.error(`Agda parse error: ${response.content}`);
            break;

        case "Goto":
            core.textBuffer.onGoto(response.filepath, response.position);
            break;

        case "SolveAllAction":
            const solutions = response.solutions;
            solutions.forEach((solution) => {
                core.textBuffer.onSolveAllAction(solution.index, solution.expression)
                    .then(core.process.give);
            });
            break;
        case "MakeCaseAction":
            core.textBuffer
                .onMakeCaseAction(response.content)
                .then(() => {
                    core.commander.load()
                        .catch((error) => { throw error; });
                });
            break;

        case "MakeCaseActionExtendLam":
            core.textBuffer.onMakeCaseActionExtendLam(response.content)
                .then(() => {
                    core.commander.load()
                        .catch((error) => { throw error; });
                });
            break;

        case "HighlightClear":
            core.highlightManager.destroyAll();
            break;

        case "HighlightAddAnnotations":
            let annotations = response.content;
            annotations.forEach((annotation) => {
                let unsolvedmeta = _.includes(annotation.type, "unsolvedmeta");
                let terminationproblem = _.includes(annotation.type, "terminationproblem")
                if (unsolvedmeta || terminationproblem) {
                    core.highlightManager.highlight(annotation);
                }
            });
            break;


        case "HighlightLoadAndDeleteAction":
            // ???
            break;

        case "UnknownAction":
            console.error(`"UnknownAction:`);
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
                core.view.set("No Goals", []);
            else
                core.view.set("Goals", action.content, View.Type.Judgement);
            break;
        case Agda.InfoActionType.Error:
            core.view.set("Error", action.content, View.Type.Error);
            break;
        case Agda.InfoActionType.TypeChecking:
            core.view.set("Type Checking", action.content);
            break;
        case Agda.InfoActionType.CurrentGoal:
            core.view.set("Current Goal", action.content, View.Type.Value);
            break;
        case Agda.InfoActionType.InferredType:
            core.view.set("Inferred Type", action.content);
            break;
        case Agda.InfoActionType.ModuleContents:
            core.view.set("Module Contents", action.content);
            break;
        case Agda.InfoActionType.Context:
            core.view.set("Context", action.content, View.Type.Judgement);
            break;
        case Agda.InfoActionType.GoalTypeEtc:
            core.view.set("Goal Type and Context", action.content, View.Type.Judgement);
            break;
        case Agda.InfoActionType.NormalForm:
            core.view.set("Normal Form", action.content, View.Type.Value);
            break;
        case Agda.InfoActionType.Intro:
            core.view.set("Intro", ['No introduction forms found']);
            break;
        case Agda.InfoActionType.Auto:
            core.view.set("Auto", ['No solution found']);
            break;
        case Agda.InfoActionType.Constraints:
            core.view.set("Constraints", action.content, View.Type.Judgement);
            break;
        case Agda.InfoActionType.ScopeInfo:
            core.view.set("Scope Info", action.content);
            break;
        default:
            console.error(`unknown info action ${action}`);
    }
}

export {
    handleAgdaResponse
}
