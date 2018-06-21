"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const Err = require("./error");
const response_handler_1 = require("./response-handler");
const Req = require("./request");
const Action = require("./view/actions");
const query_1 = require("./asset/query");
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
        //
        //  History Management
        //
        // sometimes a child command may be invoked by some parent command,
        // in that case, both the parent and the child command should be
        // regarded as a single action
        this.startCheckpoint = (command) => (connection) => {
            this.history.checkpoints.push(this.core.editor.getTextEditor().createCheckpoint());
            if (this.history.checkpoints.length === 1) {
                // see if reloading is needed on undo
                const needReload = _.includes([
                    'SolveConstraints',
                    'Give',
                    'Refine',
                    'Auto',
                    'Case'
                ], command.kind);
                this.history.reload = needReload;
            }
            return connection;
        };
        this.endCheckpoint = () => {
            const checkpoint = this.history.checkpoints.pop();
            // group changes if it's a parent command
            if (this.history.checkpoints.length === 0) {
                this.core.editor.getTextEditor().groupChangesSinceCheckpoint(checkpoint);
            }
        };
        //
        //  Dispatchers
        //
        this.dispatchUndo = () => {
            // reset goals after undo
            this.core.editor.getTextEditor().undo();
            // reload
            if (this.history.reload)
                this.dispatch({ kind: 'Load' });
        };
        this.dispatch = (command) => {
            // some commands can be executed without connection to Agda
            const needNoConnection = _.includes([
                'Quit',
                'ToggleDocking',
                'InputSymbol',
                'InputSymbolCurlyBracket',
                'InputSymbolBracket',
                'InputSymbolParenthesis',
                'InputSymbolDoubleQuote',
                'InputSymbolSingleQuote',
                'InputSymbolBackQuote',
                'QuerySymbol'
            ], command.kind);
            if (needNoConnection) {
                return this.dispatchCommand(command)(null)
                    .then(response_handler_1.handleResponses(this.core))
                    .catch(Err.QueryCancelled, () => {
                    this.core.view.set('Query cancelled', [], 4 /* Warning */);
                })
                    .catch(this.core.connection.handleAgdaError);
            }
            else {
                var connection;
                if (command.kind === 'Load') {
                    // activate the view first
                    const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                    this.core.view.mountPanel(currentMountingPosition);
                    this.core.view.activatePanel();
                    // initialize connection
                    connection = this.core.connection.connect();
                }
                else {
                    // get existing connection
                    connection = this.core.connection.getConnection();
                }
                return connection
                    .then(this.startCheckpoint(command))
                    .then(this.dispatchCommand(command))
                    .then(response_handler_1.handleResponses(this.core))
                    .finally(this.endCheckpoint)
                    .catch(this.core.connection.handleAgdaError);
            }
        };
        this.dispatchCommand = (command) => (connection) => {
            let request;
            switch (command.kind) {
                case 'Load':
                    request = this.load(connection);
                    break;
                case 'Quit':
                    request = this.quit(connection);
                    break;
                case 'Restart':
                    request = this.restart(connection);
                    break;
                case 'Abort':
                    request = Promise.resolve(this.abort(connection));
                    break;
                case 'ToggleDocking':
                    request = this.toggleDocking(connection);
                    break;
                case 'Compile':
                    request = Promise.resolve(this.compile(connection));
                    break;
                case 'ToggleDisplayOfImplicitArguments':
                    request = Promise.resolve(this.toggleDisplayOfImplicitArguments(connection));
                    break;
                case 'SolveConstraints':
                    request = Promise.resolve(this.solveConstraints(connection));
                    break;
                case 'ShowConstraints':
                    request = Promise.resolve(this.showConstraints(connection));
                    break;
                case 'ShowGoals':
                    request = Promise.resolve(this.showGoals(connection));
                    break;
                case 'NextGoal':
                    request = this.nextGoal(connection);
                    break;
                case 'PreviousGoal':
                    request = this.previousGoal(connection);
                    break;
                case 'WhyInScope':
                    request = this.whyInScope(connection);
                    break;
                case 'InferType':
                    request = this.inferType(command.normalization)(connection);
                    break;
                case 'ModuleContents':
                    request = this.moduleContents(command.normalization)(connection);
                    break;
                case 'ComputeNormalForm':
                    request = this.computeNormalForm(command.computeMode)(connection);
                    break;
                case 'Give':
                    request = this.give(connection);
                    break;
                case 'Refine':
                    request = this.refine(connection);
                    break;
                case 'Auto':
                    request = this.auto(connection);
                    break;
                case 'Case':
                    request = this.case(connection);
                    break;
                case 'GoalType':
                    request = this.goalType(command.normalization)(connection);
                    break;
                case 'Context':
                    request = this.context(command.normalization)(connection);
                    break;
                case 'GoalTypeAndContext':
                    request = this.goalTypeAndContext(command.normalization)(connection);
                    break;
                case 'GoalTypeAndInferredType':
                    request = this.goalTypeAndInferredType(command.normalization)(connection);
                    break;
                case 'InputSymbol':
                    request = this.inputSymbol(connection);
                    break;
                case 'InputSymbolCurlyBracket':
                    request = this.inputSymbolInterceptKey(command.kind, '{')(connection);
                    break;
                case 'InputSymbolBracket':
                    request = this.inputSymbolInterceptKey(command.kind, '[')(connection);
                    break;
                case 'InputSymbolParenthesis':
                    request = this.inputSymbolInterceptKey(command.kind, '(')(connection);
                    break;
                case 'InputSymbolDoubleQuote':
                    request = this.inputSymbolInterceptKey(command.kind, '"')(connection);
                    break;
                case 'InputSymbolSingleQuote':
                    request = this.inputSymbolInterceptKey(command.kind, '\'')(connection);
                    break;
                case 'InputSymbolBackQuote':
                    request = this.inputSymbolInterceptKey(command.kind, '`')(connection);
                    break;
                case 'QuerySymbol':
                    request = this.querySymbol(connection);
                    break;
                default:
                    throw `undispatched command type\n${JSON.stringify(command)}`;
            }
            return request.then(req => {
                // pushing the unfullfilled request to the back of the backlog queue of Connection
                const promise = new Promise((resolve, reject) => {
                    connection.queue.unshift({ resolve, reject });
                });
                this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                    raw: req,
                    parsed: command
                }));
                this.core.view.store.dispatch(Action.PROTOCOL.pending(true));
                // send it out
                connection.stream.write(request);
                return promise;
            });
        };
        //
        //  Commands
        //
        this.load = (connection) => {
            // force save before load
            return this.core.editor.save()
                .then(() => connection)
                .then(Req.load)
                .then(result => {
                this.loaded = true;
                return result;
            });
        };
        this.quit = (connection) => {
            this.core.view.deactivatePanel();
            const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
            this.core.view.unmountPanel(currentMountingPosition);
            if (this.loaded) {
                this.loaded = false;
                this.core.editor.goal.removeAll();
                this.core.editor.highlighting.destroyAll();
                this.core.connection.disconnect();
            }
            return null;
        };
        this.restart = (connection) => {
            return this.quit(connection)
                .then(() => connection)
                .then(this.load);
        };
        this.abort = Req.abort;
        this.toggleDocking = (connection) => {
            return this.core.view.toggleDocking()
                .then(() => null);
        };
        this.compile = Req.compile;
        this.toggleDisplayOfImplicitArguments = Req.toggleDisplayOfImplicitArguments;
        this.solveConstraints = Req.solveConstraints('Instantiated');
        this.showConstraints = Req.showConstraints;
        this.showGoals = Req.showGoals;
        this.nextGoal = (connection) => {
            return this.core.editor.jumpToNextGoal()
                .then(() => null);
        };
        this.previousGoal = (connection) => {
            return this.core.editor.jumpToPreviousGoal()
                .then(() => null);
        };
        //
        //  The following commands may have a goal-specific version
        //
        this.whyInScope = (connection) => {
            return this.core.view.query('Scope info', [], 0 /* PlainText */, 'name:')
                .then((expr) => {
                return this.core.editor.goal.pointing()
                    .then(goal => Req.whyInScope(expr, goal)(connection))
                    .catch(Err.OutOfGoalError, () => Req.whyInScopeGlobal(expr)(connection));
            });
        };
        this.inferType = (normalization) => (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                        .then(expr => Req.inferType(normalization, expr, goal)(connection));
                }
                else {
                    return Req.inferType(normalization, goal.getContent(), goal)(connection);
                }
            })
                .catch(() => {
                // global command
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                    .then(expr => Req.inferTypeGlobal(normalization, expr)(connection));
            });
        };
        this.moduleContents = (normalization) => (connection) => {
            return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], 0 /* PlainText */, 'module name:')
                .then(expr => {
                return this.core.editor.goal.pointing()
                    .then(goal => this.core.connection
                    .getConnection()
                    .then(Req.moduleContents(normalization, expr, goal)))
                    .catch((error) => {
                    return this.core.connection
                        .getConnection()
                        .then(Req.moduleContentsGlobal(normalization, expr));
                });
            });
        };
        this.computeNormalForm = (computeMode) => (connection) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                        .then(expr => Req.computeNormalForm(computeMode, expr, goal)(connection));
                }
                else {
                    return Req.computeNormalForm(computeMode, goal.getContent(), goal)(connection);
                }
            })
                .catch(Err.OutOfGoalError, () => {
                return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                    .then(expr => Req.computeNormalFormGlobal(computeMode, expr)(connection));
            });
        };
        //
        //  The following commands only working in the context of a specific goal
        //
        this.give = (connection) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Give', [], 0 /* PlainText */, 'expression to give:')
                        .then(goal.setContent);
                }
                else {
                    return goal;
                }
            })
                .then(goal => Req.give(goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.refine = (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.refine(goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.auto = (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.auto(goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.case = (connection) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Case', [], 0 /* PlainText */, 'the argument to case:')
                        .then(goal.setContent);
                }
                else {
                    return goal;
                }
            })
                .then(goal => Req.makeCase(goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.goalType = (normalization) => (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.goalType(normalization, goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.context = (normalization) => (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.context(normalization, goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.goalTypeAndContext = (normalization) => (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.goalTypeAndContext(normalization, goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.goalTypeAndInferredType = (normalization) => (connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.goalTypeAndInferredType(normalization, goal)(connection))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return null;
            });
        };
        this.inputSymbol = (connection) => {
            if (atom.config.get('agda-mode.inputMethod')) {
                if (!this.loaded) {
                    const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                    this.core.view.mountPanel(currentMountingPosition);
                    this.core.view.activatePanel();
                    this.core.view.set('Not loaded', [], 0 /* PlainText */);
                }
                this.core.inputMethod.activate();
            }
            else {
                this.core.view.editors.getFocusedEditor().insertText('\\');
            }
            return null;
        };
        this.querySymbol = (connection) => {
            return this.core.view.query(`Query Unicode symbol input sequences`, [], 0 /* PlainText */, 'symbol:')
                .then(symbol => {
                const sequences = query_1.default[symbol.codePointAt(0)] || [];
                this.core.view.set(`Input sequence for ${symbol}`, sequences, 0 /* PlainText */);
                return null;
            });
        };
        this.inputSymbolInterceptKey = (kind, key) => (connection) => {
            this.core.inputMethod.interceptAndInsertKey(key);
            return null;
        };
        this.dispatchCommand = this.dispatchCommand.bind(this);
        this.startCheckpoint = this.startCheckpoint.bind(this);
        this.endCheckpoint = this.endCheckpoint.bind(this);
        this.history = {
            checkpoints: [],
            reload: false
        };
    }
}
exports.default = Commander;
//# sourceMappingURL=commander.js.map