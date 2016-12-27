"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var error_1 = require("./error");
function toDescription(normalization) {
    switch (normalization) {
        case 'Simplified': return '';
        case 'Instantiated': return '(no normalization)';
        case 'Normalised': return '(full normalization)';
        default: throw "unknown normalization: " + normalization;
    }
}
var PendingQueue = (function () {
    function PendingQueue() {
        this.queue = [];
    }
    PendingQueue.prototype.issue = function (command) {
        if (command.expectedGoalsActionReplies === 0) {
            // synchronous command, resolves the promise right away
            return Promise.resolve(command.kind);
        }
        else {
            var pendingCommand_1 = {
                kind: command.kind,
                resolve: null,
                reject: null,
                count: command.expectedGoalsActionReplies
            };
            var promise = new Promise(function (resolve, reject) {
                pendingCommand_1.resolve = resolve;
                pendingCommand_1.reject = reject;
            });
            this.queue.push(pendingCommand_1);
            return promise;
        }
    };
    // on Error
    PendingQueue.prototype.resolve = function () {
        var pendingCommand = _.last(this.queue);
        if (pendingCommand) {
            if (pendingCommand.count > 0)
                pendingCommand.count -= 1;
            if (pendingCommand.count === 0) {
                pendingCommand.resolve(pendingCommand.kind);
                this.queue.pop();
            }
        }
    };
    // on GoalsAction
    PendingQueue.prototype.reject = function () {
        var pendingCommand = _.last(this.queue);
        if (pendingCommand) {
            pendingCommand.reject({});
            this.queue.pop();
        }
    };
    PendingQueue.prototype.clear = function () {
        this.queue.forEach(function (command) {
            command.reject({});
        });
        this.queue = [];
    };
    PendingQueue.prototype.isEmpty = function () {
        return this.queue.length === 0;
    };
    return PendingQueue;
}());
var Commander = (function () {
    function Commander(core) {
        this.core = core;
        this.pendingQueue = new PendingQueue;
    }
    Commander.prototype.activate = function (command) {
        var _this = this;
        // some commands can only be executed after 'loaded'
        var exception = [
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
                .then(function (result) {
                if (command.kind === 'Quit') {
                    _this.pendingQueue.clear();
                }
                // console.log(`Empty: ${this.pendingQueue.isEmpty()}`)
                var checkPoint = _this.core.editor.createCheckpoint();
                _this.pendingQueue.issue(command)
                    .then(function (kind) {
                    // console.log(`Succeed: ${kind}`)
                    _this.core.editor.groupChangesSinceCheckpoint(checkPoint);
                })
                    .catch(function () {
                    // console.log('Failed')
                    // this.core.editor.revertToCheckpoint(checkPoint);
                });
            })
                .catch(error_1.QueryCancelledError, function () {
                _this.core.view.set('Query cancelled', [], 4 /* Warning */);
            })
                .catch(function (error) {
                switch (error.name) {
                    case 'InvalidExecutablePathError':
                        _this.core.view.set(error.message, [error.path], 3 /* Error */);
                        break;
                    default:
                        console.error(error);
                }
            });
        }
    };
    Commander.prototype.dispatchCommand = function (command) {
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
            default: throw "undispatched command type " + command;
        }
    };
    //
    //  Commands
    //
    Commander.prototype.load = function () {
        var _this = this;
        var currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.mount(currentMountingPosition);
        this.core.view.activate();
        return this.core.process.load()
            .then(function () {
            _this.loaded = true;
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.quit = function () {
        this.core.view.deactivate();
        var currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.unmount(currentMountingPosition);
        if (this.loaded) {
            this.loaded = false;
            this.core.textBuffer.removeGoals();
            this.core.highlightManager.destroyAll();
            return this.core.process.quit()
                .then(function () { return Promise.resolve({}); });
        }
        else {
            return Promise.resolve({});
        }
    };
    Commander.prototype.restart = function () {
        this.quit();
        return this.load();
    };
    Commander.prototype.compile = function () {
        return this.core.process.compile()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.toggleDisplayOfImplicitArguments = function () {
        return this.core.process.toggleDisplayOfImplicitArguments()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.info = function () {
        return this.core.process.info()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.solveConstraints = function () {
        return this.core.process.solveConstraints()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.showConstraints = function () {
        return this.core.process.showConstraints()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.showGoals = function () {
        return this.core.process.showGoals()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.nextGoal = function () {
        return this.core.textBuffer.nextGoal()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.previousGoal = function () {
        return this.core.textBuffer.previousGoal()
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.toggleDocking = function () {
        return this.core.view.toggleDocking()
            .then(function () { return Promise.resolve({}); });
    };
    //
    //  The following commands may have a goal-specific version
    //
    Commander.prototype.whyInScope = function () {
        var _this = this;
        return this.core.view.query('Scope info', [], 0 /* PlainText */, 'name:')
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .then(function (goal) {
                // goal-specific
                return _this.core.process.whyInScope(expr, goal);
            })
                .catch(error_1.OutOfGoalError, function () {
                // global command
                return _this.core.process.whyInScope(expr);
            });
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.inferType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            // goal-specific
            if (goal.isEmpty()) {
                return _this.core.view.query("Infer type " + toDescription(normalization), [], 0 /* PlainText */, 'expression to infer:')
                    .then(_this.core.process.inferType(normalization, goal))
                    .then(function () { return Promise.resolve({}); });
            }
            else {
                return _this.core.process.inferType(normalization, goal)(goal.getContent())
                    .then(function () { return Promise.resolve({}); });
            }
        })
            .catch(function () {
            // global command
            return _this.core.view.query("Infer type " + toDescription(normalization), [], 0 /* PlainText */, 'expression to infer:')
                .then(_this.core.process.inferType(normalization))
                .then(function () { return Promise.resolve({}); });
        });
    };
    Commander.prototype.moduleContents = function (normalization) {
        var _this = this;
        return this.core.view.query("Module contents " + toDescription(normalization), [], 0 /* PlainText */, 'module name:')
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .then(_this.core.process.moduleContents(normalization, expr))
                .catch(function (error) {
                return _this.core.process.moduleContents(normalization, expr)();
            });
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.computeNormalForm = function (computeMode) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query("Compute normal form", [], 0 /* PlainText */, 'expression to normalize:')
                    .then(_this.core.process.computeNormalForm(computeMode, goal));
            }
            else {
                return _this.core.process.computeNormalForm(computeMode, goal)(goal.getContent());
            }
        })
            .catch(error_1.OutOfGoalError, function () {
            return _this.core.view.query("Compute normal form", [], 0 /* PlainText */, 'expression to normalize:')
                .then(_this.core.process.computeNormalForm(computeMode));
        })
            .then(function () { return Promise.resolve({}); });
    };
    // computeNormalFormIgnoreAbstract(): Promise<{}> {
    //     return this.core.textBuffer.getCurrentGoal()
    //         .then((goal) => {
    //             if (goal.isEmpty()) {
    //                 return this.core.view.query(`Compute normal form (ignoring abstract)`, [], View.Style.PlainText, 'expression to normalize:')
    //                     .then(this.core.process.computeNormalFormIgnoreAbstract(goal))
    //             } else {
    //                 return this.core.process.computeNormalFormIgnoreAbstract(goal)(goal.getContent())
    //             }
    //         })
    //         .catch(OutOfGoalError, () => {
    //             return this.core.view.query(`Compute normal form (ignoring abstract)`, [], View.Style.PlainText, 'expression to normalize:')
    //                 .then(this.core.process.computeNormalFormIgnoreAbstract())
    //         })
    //         .then(() => Promise.resolve({}));
    // }
    //
    //  The following commands only working in the context of a specific goal
    //
    Commander.prototype.give = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query('Give', [], 0 /* PlainText */, 'expression to give:')
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.give)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.refine = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.auto = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.case = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query('Case', [], 0 /* PlainText */, 'the argument to case:')
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.case)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.goalType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.context = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.goalTypeAndContext = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.goalTypeAndInferredType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        })
            .then(function () { return Promise.resolve({}); });
    };
    Commander.prototype.inputSymbol = function () {
        var miniEditorEnabled = this.core.view.store.getState().inputMethod.enableInMiniEditor;
        var miniEditorFocused = this.core.view.miniEditor && this.core.view.miniEditor.isFocused();
        var shouldNotActivate = miniEditorFocused && !miniEditorEnabled;
        var editor = this.core.view.getFocusedEditor();
        if (atom.config.get('agda-mode.inputMethod') && !shouldNotActivate) {
            if (!this.loaded) {
                var currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
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
    };
    Commander.prototype.inputSymbolInterceptKey = function (kind, key) {
        this.core.inputMethod.interceptAndInsertKey(key);
        return Promise.resolve({});
    };
    return Commander;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Commander;
//# sourceMappingURL=commander.js.map