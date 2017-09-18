"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const error_1 = require("./error");
const connector_1 = require("./connector");
const handler_1 = require("./handler");
const Req = require("./request");
const Action = require("./view/actions");
function toDescription(normalization) {
    switch (normalization) {
        case 'Simplified': return '';
        case 'Instantiated': return '(no normalization)';
        case 'Normalised': return '(full normalization)';
        default: throw `unknown normalization: ${normalization}`;
    }
}
class Commander {
    constructor(core) {
        this.core = core;
        this.load = this.load.bind(this);
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
                .then((actions) => {
                return Promise.each(actions, handler_1.handleAgdaAction(this.core));
                // console.log(responses)
                // if (Array.isArray(responses)) {
                //     responses.forEach(response => {
                //         try {
                //             this.core.view.store.dispatch(Action.PROTOCOL.addResponse(response));
                //             handleAgdaAction(this.core, parseAgdaResponse(response));
                //         } catch (error) {
                //             // this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
                //             console.log(error)
                //             // show some message
                //             this.core.view.set('Agda Parse Error',
                //             [`Message from agda:`].concat(response),
                //             View.Style.Error);
                //         }
                //
                //     })
                // }
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
                .catch(connector_1.ConnectionError, error => {
                this.core.view.store.dispatch(Action.CONNECTION.err(error.guid));
                this.core.view.set(error.name, error.message.split('\n'), 3 /* Error */);
            })
                .catch(connector_1.ConnectionNotEstablished, () => {
                this.core.view.set('Connection to Agda not established', [], 4 /* Warning */);
            })
                .catch(error_1.QueryCancelled, () => {
                this.core.view.set('Query cancelled', [], 4 /* Warning */);
            })
                .catch((error) => {
                if (error) {
                    console.log(error);
                    switch (error.name) {
                        case 'InvalidExecutablePathError':
                            this.core.view.set(error.message, [error.path], 3 /* Error */);
                            break;
                        default:
                            this.core.view.set(error.name, error.message.split('\n'), 3 /* Error */);
                    }
                }
                else {
                    this.core.view.set('Panic!', ['unknown error'], 3 /* Error */);
                }
            });
        }
    }
    dispatchCommand(command) {
        switch (command.kind) {
            case 'Load': return this.load();
            // case 'Quit':          return this.quit();
            // case 'Restart':       return this.restart();
            // case 'Info':          return this.info();
            // case 'ToggleDocking': return this.toggleDocking();
            // case 'Compile':       return this.compile();
            // case 'ToggleDisplayOfImplicitArguments':
            //     return this.toggleDisplayOfImplicitArguments();
            // case 'SolveConstraints':
            //     return this.solveConstraints();
            // case 'ShowConstraints':
            //     return this.showConstraints();
            // case 'ShowGoals':
            //     return this.showGoals();
            // case 'NextGoal':      return this.nextGoal();
            // case 'PreviousGoal':  return this.previousGoal();
            // case 'WhyInScope':    return this.whyInScope();
            // case 'InferType':
            //     return this.inferType(command.normalization);
            // case 'ModuleContents':
            //     return this.moduleContents(command.normalization);
            // case 'ComputeNormalForm':
            //     return this.computeNormalForm(command.computeMode);
            // case 'Give':          return this.give();
            // case 'Refine':        return this.refine();
            // case 'Auto':          return this.auto();
            // case 'Case':          return this.case();
            // case 'GoalType':
            //     return this.goalType(command.normalization);
            // case 'Context':
            //     return this.context(command.normalization);
            // case 'GoalTypeAndContext':
            //     return this.goalTypeAndContext(command.normalization);
            // case 'GoalTypeAndInferredType':
            //     return this.goalTypeAndInferredType(command.normalization);
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
            default: throw `undispatched command type\n${JSON.stringify(command)}`;
        }
    }
    //
    //  Commands
    //
    load() {
        // activate the view
        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.mountPanel(currentMountingPosition);
        this.core.view.activatePanel();
        return this.core.connector
            .connect()
            .then((conn) => {
            this.loaded = true;
            // force save before load
            // issue #48, TextBuffer::save will be async in Atom 1.19
            let promise = this.core.editor.save();
            if (promise && promise.then) {
                return promise.then((e) => {
                    return conn;
                });
            }
            else {
                return conn;
            }
        })
            .then(Req.load);
    }
    quit() {
        this.core.view.deactivatePanel();
        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
        this.core.view.unmountPanel(currentMountingPosition);
        if (this.loaded) {
            this.loaded = false;
            this.core.textBuffer.removeGoals();
            this.core.highlightManager.destroyAll();
            this.core.connector.disconnect();
        }
        return Promise.resolve([]);
    }
    restart() {
        this.quit();
        return this.load();
    }
    info() {
        return this.core.connector
            .getConnection()
            .then(conn => {
            this.core.view.set('Info', [
                `Agda version: ${conn.agda.version.raw}`,
                `Agda executable path: ${conn.agda.location}`
                // `Agda executable arguments: ${args.join(' ')}`
            ], 0 /* PlainText */);
            return [];
        });
    }
    toggleDocking() {
        return this.core.view.toggleDocking()
            .then(() => Promise.resolve([]));
    }
    compile() {
        return this.core.connector
            .getConnection()
            .then(Req.compile);
    }
    toggleDisplayOfImplicitArguments() {
        return this.core.connector
            .getConnection()
            .then(Req.toggleDisplayOfImplicitArguments);
    }
    solveConstraints() {
        return this.core.connector
            .getConnection()
            .then(Req.solveConstraints);
    }
    showConstraints() {
        return this.core.connector
            .getConnection()
            .then(Req.showConstraints);
    }
    showGoals() {
        return this.core.connector
            .getConnection()
            .then(Req.showGoals);
    }
    nextGoal() {
        return this.core.textBuffer.nextGoal()
            .then(() => Promise.resolve([]));
    }
    previousGoal() {
        return this.core.textBuffer.previousGoal()
            .then(() => Promise.resolve([]));
    }
    //
    //  The following commands may have a goal-specific version
    //
    whyInScope() {
        return this.core.view.query('Scope info', [], 0 /* PlainText */, 'name:')
            .then((expr) => {
            return this.core.textBuffer.getCurrentGoal()
                .then(goal => this.core.connector
                .getConnection()
                .then(Req.whyInScope(expr, goal)))
                .catch(error_1.OutOfGoalError, () => this.core.connector
                .getConnection()
                .then(Req.whyInScopeGlobal(expr)));
        });
    }
    inferType(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => {
            // goal-specific
            if (goal.isEmpty()) {
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                    .then(expr => this.core.connector
                    .getConnection()
                    .then(Req.inferType(normalization, expr, goal)));
            }
            else {
                return this.core.connector
                    .getConnection()
                    .then(Req.inferType(normalization, goal.getContent(), goal));
            }
        })
            .catch(() => {
            // global command
            return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                .then(expr => this.core.connector
                .getConnection()
                .then(Req.inferTypeGlobal(normalization, expr)));
        });
    }
    moduleContents(normalization) {
        return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], 0 /* PlainText */, 'module name:')
            .then(expr => {
            return this.core.textBuffer.getCurrentGoal()
                .then(goal => this.core.connector
                .getConnection()
                .then(Req.moduleContents(normalization, expr, goal)))
                .catch((error) => {
                return this.core.connector
                    .getConnection()
                    .then(Req.moduleContentsGlobal(normalization, expr));
            });
        });
    }
    computeNormalForm(computeMode) {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
            if (goal.isEmpty()) {
                return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                    .then(expr => this.core.connector
                    .getConnection()
                    .then(Req.computeNormalForm(computeMode, expr, goal)));
            }
            else {
                return this.core.connector
                    .getConnection()
                    .then(Req.computeNormalForm(computeMode, goal.getContent(), goal));
            }
        })
            .catch(error_1.OutOfGoalError, () => {
            return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                .then(expr => this.core.connector
                .getConnection()
                .then(Req.computeNormalFormGlobal(computeMode, expr)));
        });
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
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.give(goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    refine() {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.refine(goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    auto() {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.auto(goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
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
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.makeCase(goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    goalType(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.goalType(normalization, goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    context(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.context(normalization, goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    goalTypeAndContext(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.goalTypeAndContext(normalization, goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    goalTypeAndInferredType(normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => this.core.connector
            .getConnection()
            .then(Req.goalTypeAndInferredType(normalization, goal)))
            .catch(error_1.OutOfGoalError, () => {
            this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
        });
    }
    inputSymbol() {
        // const miniEditorFocused = this.core.view.editors.general && this.core.view.editors.general.isFocused();
        // const shouldNotActivate = miniEditorFocused && !enableInMiniEditor;
        const shouldNotActivate = this.core.view.editors.focused() === 'connection';
        if (atom.config.get('agda-mode.inputMethod') && !shouldNotActivate) {
            if (!this.loaded) {
                const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                this.core.view.mountPanel(currentMountingPosition);
                this.core.view.activatePanel();
                this.core.view.set('Not loaded', [], 0 /* PlainText */);
            }
            this.core.inputMethod.activate();
        }
        else {
            this.core.view.editors.getFocusedEditorElement().insertText('\\');
        }
        return Promise.resolve([]);
    }
    inputSymbolInterceptKey(kind, key) {
        this.core.inputMethod.interceptAndInsertKey(key);
        return Promise.resolve([]);
    }
}
exports.default = Commander;
//# sourceMappingURL=commander.js.map