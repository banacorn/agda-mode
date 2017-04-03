"use strict";
const Promise = require("bluebird");
const _ = require("lodash");
const error_1 = require("./error");
function toDescription(normalization) {
    switch (normalization) {
        case 'Simplified': return '';
        case 'Instantiated': return '(no normalization)';
        case 'Normalised': return '(full normalization)';
        default: throw `unknown normalization: ${normalization}`;
    }
}
class PendingQueue {
    constructor() {
        this.queue = [];
    }
    issue(command) {
        if (command.expectedGoalsActionReplies === 0) {
            // synchronous command, resolves the promise right away
            return Promise.resolve(command.kind);
        }
        else {
            let pendingCommand = {
                kind: command.kind,
                resolve: null,
                reject: null,
                count: command.expectedGoalsActionReplies
            };
            const promise = new Promise((resolve, reject) => {
                pendingCommand.resolve = resolve;
                pendingCommand.reject = reject;
            });
            this.queue.push(pendingCommand);
            return promise;
        }
    }
    // on Error
    resolve() {
        const pendingCommand = _.last(this.queue);
        if (pendingCommand) {
            if (pendingCommand.count > 0)
                pendingCommand.count -= 1;
            if (pendingCommand.count === 0) {
                pendingCommand.resolve(pendingCommand.kind);
                this.queue.pop();
            }
        }
    }
    // on GoalsAction
    reject() {
        const pendingCommand = _.last(this.queue);
        if (pendingCommand) {
            pendingCommand.reject({});
            this.queue.pop();
        }
    }
    clear() {
        this.queue.forEach(command => {
            command.reject({});
        });
        this.queue = [];
    }
    isEmpty() {
        return this.queue.length === 0;
    }
}
class Commander {
    constructor(core) {
        this.core = core;
        this.pendingQueue = new PendingQueue;
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
        if (this.loaded || _.includes(exception, command.kind)) {
            this.dispatchCommand(command)
                .then((result) => {
                if (command.kind === 'Quit') {
                    this.pendingQueue.clear();
                }
                // console.log(`Empty: ${this.pendingQueue.isEmpty()}`)
                const checkPoint = this.core.editor.createCheckpoint();
                this.pendingQueue.issue(command)
                    .then((kind) => {
                    // console.log(`Succeed: ${kind}`)
                    this.core.editor.groupChangesSinceCheckpoint(checkPoint);
                })
                    .catch(() => {
                    // console.log('Failed')
                    // this.core.editor.revertToCheckpoint(checkPoint);
                });
            })
                .catch(error_1.QueryCancelledError, () => {
                this.core.view.set('Query cancelled', [], 4 /* Warning */);
            })
                .catch((error) => {
                switch (error.name) {
                    case 'InvalidExecutablePathError':
                        this.core.view.set(error.message, [error.path], 3 /* Error */);
                        break;
                    default:
                        console.error(error);
                }
            });
        }
    }
    dispatchCommand(command) {
        switch (command.kind) {
            case 'Load': return this.load();
            case 'Quit': return this.quit();
            case 'Restart': return this.restart();
            case 'Compile': return this.compile();
            case 'ToggleDisplayOfImplicitArguments':
                return this.toggleDisplayOfImplicitArguments();
            case 'Info': return this.info();
            case 'SolveConstraints':
                return this.solveConstraints();
            case 'ShowConstraints':
                return this.showConstraints();
            case 'ShowGoals':
                return this.showGoals();
            case 'NextGoal': return this.nextGoal();
            case 'PreviousGoal': return this.previousGoal();
            case 'ToggleDocking': return this.toggleDocking();
            case 'WhyInScope': return this.whyInScope();
            case 'InferType':
                return this.inferType(command.normalization);
            case 'ModuleContents':
                return this.moduleContents(command.normalization);
            case 'ComputeNormalForm':
                return this.computeNormalForm(command.computeMode);
            case 'Give': return this.give();
            case 'Refine': return this.refine();
            case 'Auto': return this.auto();
            case 'Case': return this.case();
            case 'GoalType':
                return this.goalType(command.normalization);
            case 'Context':
                return this.context(command.normalization);
            case 'GoalTypeAndContext':
                return this.goalTypeAndContext(command.normalization);
            case 'GoalTypeAndInferredType':
                return this.goalTypeAndInferredType(command.normalization);
            case 'InputSymbol': return this.inputSymbol();
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
            default: throw `undispatched command type ${command}`;
        }
    }
    //
    //  Commands
    //
    load() {
        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.mount(currentMountingPosition);
        this.core.view.activate();
        return this.core.process.load()
            .then(() => {
            this.loaded = true;
        })
            .then(() => Promise.resolve({}));
    }
    quit() {
        this.core.view.deactivate();
        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.unmount(currentMountingPosition);
        if (this.loaded) {
            this.loaded = false;
            this.core.textBuffer.removeGoals();
            this.core.highlightManager.destroyAll();
            return this.core.process.quit()
                .then(() => Promise.resolve({}));
        }
        else {
            return Promise.resolve({});
        }
    }
    restart() {
        this.quit();
        return this.load();
    }
    compile() {
        return this.core.process.compile()
            .then(() => Promise.resolve({}));
    }
    toggleDisplayOfImplicitArguments() {
        return this.core.process.toggleDisplayOfImplicitArguments()
            .then(() => Promise.resolve({}));
    }
    info() {
        return this.core.process.info()
            .then(() => Promise.resolve({}));
    }
    solveConstraints() {
        return this.core.process.solveConstraints()
            .then(() => Promise.resolve({}));
    }
    showConstraints() {
        return this.core.process.showConstraints()
            .then(() => Promise.resolve({}));
    }
    showGoals() {
        return this.core.process.showGoals()
            .then(() => Promise.resolve({}));
    }
    nextGoal() {
        return this.core.textBuffer.nextGoal()
            .then(() => Promise.resolve({}));
    }
    previousGoal() {
        return this.core.textBuffer.previousGoal()
            .then(() => Promise.resolve({}));
    }
    toggleDocking() {
        return this.core.view.toggleDocking()
            .then(() => Promise.resolve({}));
    }
    //
    //  The following commands may have a goal-specific version
    //
    whyInScope() {
        return this.core.view.query('Scope info', [], 0 /* PlainText */, 'name:')
            .then((expr) => {
            return this.core.textBuffer.getCurrentGoal()
                .then((goal) => {
                // goal-specific
                return this.core.process.whyInScope(expr, goal);
            })
                .catch(error_1.OutOfGoalError, () => {
                // global command
                return this.core.process.whyInScope(expr);
            });
        })
            .then(() => Promise.resolve({}));
    }
    inferType(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
            // goal-specific
            if (goal.isEmpty()) {
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                    .then(this.core.process.inferType(normalization, goal))
                    .then(() => Promise.resolve({}));
            }
            else {
                return this.core.process.inferType(normalization, goal)(goal.getContent())
                    .then(() => Promise.resolve({}));
            }
        })
            .catch(() => {
            // global command
            return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                .then(this.core.process.inferType(normalization))
                .then(() => Promise.resolve({}));
        });
    }
    moduleContents(normalization) {
        return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], 0 /* PlainText */, 'module name:')
            .then((expr) => {
            return this.core.textBuffer.getCurrentGoal()
                .then(this.core.process.moduleContents(normalization, expr))
                .catch((error) => {
                return this.core.process.moduleContents(normalization, expr)();
            });
        })
            .then(() => Promise.resolve({}));
    }
    computeNormalForm(computeMode) {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
            if (goal.isEmpty()) {
                return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                    .then(this.core.process.computeNormalForm(computeMode, goal));
            }
            else {
                return this.core.process.computeNormalForm(computeMode, goal)(goal.getContent());
            }
        })
            .catch(error_1.OutOfGoalError, () => {
            return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                .then(this.core.process.computeNormalForm(computeMode));
        })
            .then(() => Promise.resolve({}));
    }
    //
    //  The following commands only working in the context of a specific goal
    //
    give() {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
            if (goal.isEmpty()) {
                return this.core.view.query('Give', [], 0 /* PlainText */, 'expression to give:')
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.give)
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    refine() {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    auto() {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    case() {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
            if (goal.isEmpty()) {
                return this.core.view.query('Case', [], 0 /* PlainText */, 'the argument to case:')
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.case)
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    goalType(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    context(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    goalTypeAndContext(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    goalTypeAndInferredType(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(() => Promise.resolve({}));
    }
    inputSymbol() {
        const miniEditorEnabled = this.core.view.store.getState().inputMethod.enableInMiniEditor;
        const miniEditorFocused = this.core.view.miniEditor && this.core.view.miniEditor.isFocused();
        const shouldNotActivate = miniEditorFocused && !miniEditorEnabled;
        const editor = this.core.view.getFocusedEditor();
        if (atom.config.get('agda-mode.inputMethod') && !shouldNotActivate) {
            if (!this.loaded) {
                const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                this.core.view.mount(currentMountingPosition);
                this.core.view.activate();
                this.core.view.set('Not loaded', [], 0 /* PlainText */);
            }
            this.core.inputMethod.activate();
        }
        else {
            editor.insertText('\\');
        }
        return Promise.resolve({});
    }
    inputSymbolInterceptKey(kind, key) {
        this.core.inputMethod.interceptAndInsertKey(key);
        return Promise.resolve({});
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Commander;
//# sourceMappingURL=commander.js.map