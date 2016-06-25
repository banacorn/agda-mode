import * as Promise from "bluebird";
import * as _ from "lodash";
import { OutOfGoalError, EmptyGoalError, QueryCancelledError, NotLoadedError } from "./error";
import { Command, CommandType, Normalization, Result } from "./types";
import Core from "./core";

declare var atom: any;

function resolveCommand(commandType: CommandType): (any) => Promise<Result> {
    return () => {
        return Promise.resolve({ type: commandType });
    }
}

function toCamalCase(str: string): string {
    return str.split("-")
        .map((str, i) => {
            if (i === 0)
                return str;
            else
                return str.charAt(0).toUpperCase() + str.slice(1);
        })
        .join("");
}

function toDescription(normalization: Normalization): string {
    switch(normalization) {
        case "Simplified":      return "";
        case "Instantiated":    return "(no normalization)";
        case "Normalised":      return "(full normalization)";
        default:                throw `unknown normalization: ${normalization}`;
    }
}


export default class Commander {
    private loaded: boolean;

    constructor(private core: Core) {}

    activate(command: Command) {
        // some commands can only be executed after "loaded"
        const exception = [CommandType.Load, CommandType.InputSymbol];
        if(this.loaded || _.includes(exception, command.type)) {
            let test = this.dispatchCommand(command)
            test.catch((error) => { throw error; });
        }
    }

    dispatchCommand(command: Command): Promise<Result> {
        switch(command.type) {
            case CommandType.Load:          return this.load();
            case CommandType.Quit:          return this.quit();
            case CommandType.Restart:       return this.restart();
            case CommandType.Compile:       return this.compile();
            case CommandType.ToggleDisplayOfImplicitArguments:
                return this.toggleDisplayOfImplicitArguments();
            case CommandType.Info:          return this.info();
            case CommandType.SolveConstraints:
                return this.solveConstraints();
            case CommandType.ShowConstraints:
                return this.showConstraints();
            case CommandType.NextGoal:      return this.nextGoal();
            case CommandType.PreviousGoal:  return this.previousGoal();
            case CommandType.WhyInScope:    return this.whyInScope();
            case CommandType.InferType:
                return this.inferType(command.normalization);
            case CommandType.ModuleContents:
                return this.moduleContents(command.normalization);
            case CommandType.ComputeNormalForm:
                return this.computeNormalForm();
            case CommandType.ComputeNormalFormIgnoreAbstract:
                return this.computeNormalFormIgnoreAbstract();
            case CommandType.Give:          return this.give();
            case CommandType.Refine:        return this.refine();
            case CommandType.Auto:          return this.auto();
            case CommandType.Case:          return this.case();
            case CommandType.GoalType:
                return this.goalType(command.normalization);
            case CommandType.Context:
                return this.context(command.normalization);
            case CommandType.GoalTypeAndContext:
                return this.goalTypeAndContext(command.normalization);
            case CommandType.GoalTypeAndInferredType:
                return this.goalTypeAndInferredType(command.normalization);
            case CommandType.InputSymbol:   return this.inputSymbol();
            default:    throw `unknown command type ${command}`
        }
    }

    //
    //  Commands
    //

    load(): Promise<Result> {
        this.core.atomPanel.show();
        return this.core.process.load()
            .then(() => {
                this.loaded = true;
            })
            .then(resolveCommand(CommandType.Load));
    }

    quit(): Promise<Result> {
        if (this.loaded) {
            this.loaded = false;
            this.core.atomPanel.hide();
            this.core.textBuffer.removeGoals();
            return this.core.process.quit()
                .then(resolveCommand(CommandType.Quit));
        } else {
            return Promise.reject(new NotLoadedError("the file is not loaded"));
        }
    }

    restart(): Promise<Result> {
        this.quit();
        return this.load();
    }


    compile(): Promise<Result> {
        return this.core.process.compile()
            .then(resolveCommand(CommandType.Compile));
    }

    toggleDisplayOfImplicitArguments(): Promise<Result> {
        return this.core.process.toggleDisplayOfImplicitArguments()
            .then(resolveCommand(CommandType.ToggleDisplayOfImplicitArguments));
    }

    info(): Promise<Result> {
        return this.core.process.info()
            .then(resolveCommand(CommandType.Info));
    }

    solveConstraints(): Promise<Result> {
        return this.core.process.solveConstraints()
            .then(resolveCommand(CommandType.SolveConstraints));
    }

    showConstraints(): Promise<Result> {
        return this.core.process.showConstraints()
            .then(resolveCommand(CommandType.ShowConstraints));
    }

    showGoals(): Promise<Result> {
        return this.core.process.showGoals()
            .then(resolveCommand(CommandType.ShowGoals));
    }

    nextGoal(): Promise<Result> {
        return this.core.textBuffer.nextGoal()
            .then(resolveCommand(CommandType.NextGoal));
    }

    previousGoal(): Promise<Result> {
        return this.core.textBuffer.previousGoal()
            .then(resolveCommand(CommandType.PreviousGoal));
    }

    whyInScope(): Promise<Result> {
        this.core.panel.setContent("Scope info", [], "plain-text", "name:");
        this.core.panel.queryMode = true;

        return this.core.panel.query()
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .done((goal) => {
                        // goal-specific
                        this.core.textBuffer.focus();
                        return this.core.process.whyInScope(expr, goal);
                    }, () => {
                        // global command
                        this.core.textBuffer.focus();
                        return this.core.process.whyInScope(expr);
                    });
            });
    }

    inferType(normalization: Normalization): Promise<Result> {
        this.core.panel.setContent(`Infer type ${toDescription(normalization)}`, [], "value", "expression to infer:");
        this.core.panel.queryMode = true;
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.panel.query()
                        .then((expr) => {
                            this.core.process.inferType(normalization, expr, goal);
                        });
                } else {
                    return this.core.process.inferType(normalization, goal.getContent(), goal);
                }
            })
            .catch(() => {
                // global command
                return this.core.panel.query()
                    .then((expr) => {
                        return this.core.process.inferType(normalization, expr);
                    });
            })
    }


    moduleContents(normalization: Normalization): Promise<Result> {
        this.core.panel.setContent(`Module contents ${toDescription(normalization)}`, [], "plain-text", "module name:");
        return this.core.panel.query()
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .done((goal) => {
                        // goal-specific
                        this.core.textBuffer.focus();
                        return this.core.process.moduleContents(normalization, expr, goal);
                    }, () => {
                        // global command
                        this.core.textBuffer.focus();
                        return this.core.process.moduleContents(normalization, expr);
                    });
            });
    }


    computeNormalForm(): Promise<Result> {
        this.core.panel.setContent("Compute normal form", [], "value", "expression to normalize:");
        return this.core.panel.query()
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .done((goal) => {
                        // goal-specific
                        this.core.textBuffer.focus();
                        return this.core.process.computeNormalForm(expr, goal);
                    }, () => {
                        // global command
                        this.core.textBuffer.focus();
                        return this.core.process.computeNormalForm(expr);
                    });
            });
    }


    computeNormalFormIgnoreAbstract(): Promise<Result> {
        this.core.panel.setContent("Compute normal form (ignoring abstract)", [], "value", "expression to normalize:");
        return this.core.panel.query()
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .done((goal) => {
                        // goal-specific
                        this.core.textBuffer.focus();
                        return this.core.process.computeNormalFormIgnoreAbstract(expr, goal);
                    }, () => {
                        // global command
                        this.core.textBuffer.focus();
                        return this.core.process.computeNormalFormIgnoreAbstract(expr);
                    });
            });
    }

    give(): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    this.core.panel.setContent("Give", [], "plain-text", "expression to give:");
                    this.core.panel.query()
                        .then((expr) => {
                            goal.setContent(expr);
                            return goal;
                        });
                } else {
                    return goal;
                }
            })
            .then(this.core.process.give)
            .then(resolveCommand(CommandType.Give));
    }

    refine(): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .then(resolveCommand(CommandType.Refine));
    }

    auto(): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .then(resolveCommand(CommandType.Auto));
    }

    case(): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    this.core.panel.setContent("Case", [], "plain-text", "expression to case:");
                    this.core.panel.query()
                        .then((expr) => {
                            goal.setContent(expr);
                            return goal
                        });
                } else {
                    return goal;
                }
            })
            .then(this.core.process.case)
            .then(resolveCommand(CommandType.Case));
    }

    goalType(normalization: Normalization): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .then(resolveCommand(CommandType.GoalType));
    }

    context(normalization: Normalization): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .then(resolveCommand(CommandType.Context));
    }

    goalTypeAndContext(normalization: Normalization): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .then(resolveCommand(CommandType.GoalTypeAndContext));
    }

    goalTypeAndInferredType(normalization: Normalization): Promise<Result> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .then(resolveCommand(CommandType.GoalTypeAndInferredType));
    }

    inputSymbol(): Promise<Result> {
        if (atom.config.get("agda-mode.inputMethod")) {
            if (!this.loaded) {
                this.core.atomPanel.show();
                this.core.panel.setContent("Not loaded", [], "warning");
            }
            this.core.inputMethod.activate();
        } else {
            this.core.editor.insertText("\\");
        }
        return Promise.resolve({ type: CommandType.InputSymbol });
    }
}
