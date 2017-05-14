import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { inspect } from 'util';
import { OutOfGoalError, EmptyGoalError, QueryCancelledError, NotLoadedError, InvalidExecutablePathError } from './error';
import { Normalization, ComputeMode, View } from './type';
import Core from './core';
import * as Command from './command';

declare var atom: any;


function toDescription(normalization: Normalization): string {
    switch(normalization) {
        case 'Simplified':      return '';
        case 'Instantiated':    return '(no normalization)';
        case 'Normalised':      return '(full normalization)';
        default:                throw `unknown normalization: ${normalization}`;
    }
}

export default class Commander {
    private loaded: boolean;

    constructor(private core: Core) {
    }

    activate(command) {
        // some commands can only be executed after 'loaded'
        const exception = [
                'Load',
                'Quit',
                'Info',
                'InputSymbol',
                'InputSymbolCurlyBracket',
                'InputSymbolBracket',
                'InputSymbolParenthesis',
                'InputSymbolDoubleQuote',
                'InputSymbolSingleQuote',
                'InputSymbolBackQuote'
            ];
        if(this.loaded || _.includes(exception, command.kind)) {
            this.dispatchCommand(command)
                .then((result) => {
                    // if (command.kind === 'Quit') {
                    //     this.pendingQueue.clear();
                    // }
                    //
                    // // console.log(`Empty: ${this.pendingQueue.isEmpty()}`)
                    // const checkPoint = this.core.editor.createCheckpoint();
                    // this.pendingQueue.issue(command)
                    //     .then((kind) => {
                    //         // console.log(`Succeed: ${kind}`)
                    //         this.core.editor.groupChangesSinceCheckpoint(checkPoint);
                    //     })
                    //     .catch(() => {
                    //         // console.log('Failed')
                    //         // this.core.editor.revertToCheckpoint(checkPoint);
                    //     })
                })
                .catch(QueryCancelledError, () => {
                    this.core.view.set('Query cancelled', [], View.Style.Warning);
                })
                .catch((error) => { // catch all the rest
                    switch (error.name) {
                        case 'InvalidExecutablePathError':
                            this.core.view.set(error.message, [error.path], View.Style.Error);
                            break;
                        default:
                            console.error(error);
                    }
                })
        }
    }

    dispatchCommand(command): Promise<{}> {
        switch(command.kind) {
            case 'Load':          return this.load();
            case 'Quit':          return this.quit();
            case 'Restart':       return this.restart();
            case 'Compile':       return this.compile();
            case 'ToggleDisplayOfImplicitArguments':
                return this.toggleDisplayOfImplicitArguments();
            case 'Info':          return this.info();
            case 'SolveConstraints':
                return this.solveConstraints();
            case 'ShowConstraints':
                return this.showConstraints();
            case 'ShowGoals':
                return this.showGoals();
            case 'NextGoal':      return this.nextGoal();
            case 'PreviousGoal':  return this.previousGoal();
            case 'ToggleDocking':  return this.toggleDocking();
            case 'WhyInScope':    return this.whyInScope();
            case 'InferType':
                return this.inferType(command.normalization);
            case 'ModuleContents':
                return this.moduleContents(command.normalization);
            case 'ComputeNormalForm':
                return this.computeNormalForm(command.computeMode);
            case 'Give':          return this.give();
            case 'Refine':        return this.refine();
            case 'Auto':          return this.auto();
            case 'Case':          return this.case();
            case 'GoalType':
                return this.goalType(command.normalization);
            case 'Context':
                return this.context(command.normalization);
            case 'GoalTypeAndContext':
                return this.goalTypeAndContext(command.normalization);
            case 'GoalTypeAndInferredType':
                return this.goalTypeAndInferredType(command.normalization);
            case 'InputSymbol':   return this.inputSymbol();
            case 'InputSymbolCurlyBracket':
                return this.inputSymbolInterceptKey(command.kind, '{');
            case 'InputSymbolBracket':
                return this.inputSymbolInterceptKey(command.kind, '[');
            case 'InputSymbolParenthesis':
                return this.inputSymbolInterceptKey(command.kind, '(');
            case 'InputSymbolDoubleQuote':
                return this.inputSymbolInterceptKey(command.kind, '"');
            case 'InputSymbolSingleQuote':
                return this.inputSymbolInterceptKey(command.kind, '\'');
            case 'InputSymbolBackQuote':
                return this.inputSymbolInterceptKey(command.kind, '`');
            default:    throw `undispatched command type ${command}`
        }
    }

    //
    //  Commands
    //

    load(): Promise<{}> {
        // activate the view
        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.mount(currentMountingPosition);
        this.core.view.activate();

        this.core.connector.connect()
            .then((conn) => {
                this.loaded = true;
                // force save before load
                this.core.textBuffer.saveBuffer();
                return conn;
            })
            .then(Command.load)

        return Promise.resolve({});
    }

    quit(): Promise<{}> {
        this.core.view.deactivate();
        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.unmount(currentMountingPosition);
        if (this.loaded) {
            this.loaded = false;
            this.core.textBuffer.removeGoals();
            this.core.highlightManager.destroyAll();
            this.core.connector.disconnect();
        }
        return Promise.resolve({});
    }

    restart(): Promise<{}> {
        this.quit();
        return this.load();
    }

    compile(): Promise<{}> {
        this.core.connector.connect()
            .then(Command.compile);
        return Promise.resolve({});
    }

    toggleDisplayOfImplicitArguments(): Promise<{}> {
        this.core.connector.connect()
            .then(Command.toggleDisplayOfImplicitArguments);
        return Promise.resolve({});
    }

    info(): Promise<{}> {
        this.core.connector.connect()
            .then(conn => {
                this.core.view.set('Info', [
                    `Agda version: ${conn.version.raw}`,
                    `Agda executable path: ${conn.uri}`
                    // `Agda executable arguments: ${args.join(' ')}`
                ], View.Style.PlainText);
            });
        return Promise.resolve({});
    }

    solveConstraints(): Promise<{}> {
        return this.core.process.solveConstraints()
            .then(() => Promise.resolve({}));
    }

    showConstraints(): Promise<{}> {
        return this.core.process.showConstraints()
            .then(() => Promise.resolve({}));
    }

    showGoals(): Promise<{}> {
        return this.core.process.showGoals()
            .then(() => Promise.resolve({}));
    }

    nextGoal(): Promise<{}> {
        return this.core.textBuffer.nextGoal()
            .then(() => Promise.resolve({}));
    }

    previousGoal(): Promise<{}> {
        return this.core.textBuffer.previousGoal()
            .then(() => Promise.resolve({}));
    }

    toggleDocking(): Promise<{}> {
        return this.core.view.toggleDocking()
            .then(() => Promise.resolve({}));
    }

    //
    //  The following commands may have a goal-specific version
    //

    whyInScope(): Promise<{}> {
        return this.core.view.query('Scope info', [], View.Style.PlainText, 'name:')
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .then((goal) => {
                        // goal-specific
                        return this.core.process.whyInScope(expr, goal);
                    })
                    .catch(OutOfGoalError, () => {
                        // global command
                        return this.core.process.whyInScope(expr);
                    });
            })
            .then(() => Promise.resolve({}));

    }

    inferType(normalization: Normalization): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
                        .then(this.core.process.inferType(normalization, goal))
                        .then(() => Promise.resolve({}));
                } else {
                    return this.core.process.inferType(normalization, goal)(goal.getContent())
                        .then(() => Promise.resolve({}));
                }
            })
            .catch(() => {
                // global command
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
                    .then(this.core.process.inferType(normalization))
                    .then(() => Promise.resolve({}));
            })
    }


    moduleContents(normalization: Normalization): Promise<{}> {
        return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], View.Style.PlainText, 'module name:')
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .then(this.core.process.moduleContents(normalization, expr))
                    .catch((error) => {
                        return this.core.process.moduleContents(normalization, expr)();
                    });
            })
            .then(() => Promise.resolve({}));
    }


    computeNormalForm(computeMode: ComputeMode): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query(`Compute normal form`, [], View.Style.PlainText, 'expression to normalize:')
                        .then(this.core.process.computeNormalForm(computeMode, goal))
                } else {
                    return this.core.process.computeNormalForm(computeMode, goal)(goal.getContent())
                }
            })
            .catch(OutOfGoalError, () => {
                return this.core.view.query(`Compute normal form`, [], View.Style.PlainText, 'expression to normalize:')
                    .then(this.core.process.computeNormalForm(computeMode))
            })
            .then(() => Promise.resolve({}));

    }

    //
    //  The following commands only working in the context of a specific goal
    //

    give(): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Give', [], View.Style.PlainText, 'expression to give:')
                        .then(goal.setContent);
                } else {
                    return goal;
                }
            })
            .then(this.core.process.give)
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    refine(): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    auto(): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    case(): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Case', [], View.Style.PlainText, 'the argument to case:')
                        .then(goal.setContent);
                } else {
                    return goal;
                }
            })
            .then(this.core.process.case)
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    goalType(normalization: Normalization): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    context(normalization: Normalization): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    goalTypeAndContext(normalization: Normalization): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    goalTypeAndInferredType(normalization: Normalization): Promise<{}> {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
            })
            .then(() => Promise.resolve({}));
    }

    inputSymbol(): Promise<{}> {
        const miniEditorEnabled = this.core.view.store.getState().inputMethod.enableInMiniEditor;
        const miniEditorFocused = this.core.view.miniEditor && this.core.view.miniEditor.isFocused();
        const shouldNotActivate = miniEditorFocused && !miniEditorEnabled;
        const editor = this.core.view.getFocusedEditor();
        if (atom.config.get('agda-mode.inputMethod') && !shouldNotActivate) {
            if (!this.loaded) {
                const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                this.core.view.mount(currentMountingPosition);
                this.core.view.activate();
                this.core.view.set('Not loaded', [], View.Style.PlainText);
            }
            this.core.inputMethod.activate();
        } else {
            editor.insertText('\\');
        }
        return Promise.resolve({});
    }

    inputSymbolInterceptKey(kind, key: string): Promise<{}> {
        this.core.inputMethod.interceptAndInsertKey(key);
        return Promise.resolve({});
    }
}
