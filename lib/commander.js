"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const Err = require("./error");
const response_handler_1 = require("./response-handler");
const Req = require("./request");
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
        this.startCheckpoint = (command) => (conn) => {
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
            return conn;
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
                    .catch(this.core.connection.handleError);
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
                    .catch(this.core.connection.handleError);
            }
        };
        this.dispatchCommand = (command) => {
            switch (command.kind) {
                case 'Load': return this.load;
                case 'Quit': return this.quit;
                case 'Restart': return this.restart;
                case 'ToggleDocking': return this.toggleDocking;
                case 'Compile': return this.compile;
                case 'ToggleDisplayOfImplicitArguments':
                    return this.toggleDisplayOfImplicitArguments;
                case 'SolveConstraints':
                    return this.solveConstraints;
                case 'ShowConstraints':
                    return this.showConstraints;
                case 'ShowGoals':
                    return this.showGoals;
                case 'NextGoal': return this.nextGoal;
                case 'PreviousGoal': return this.previousGoal;
                case 'WhyInScope': return this.whyInScope;
                case 'InferType':
                    return this.inferType(command.normalization);
                case 'ModuleContents':
                    return this.moduleContents(command.normalization);
                case 'ComputeNormalForm':
                    return this.computeNormalForm(command.computeMode);
                case 'Give': return this.give;
                case 'Refine': return this.refine;
                case 'Auto': return this.auto;
                case 'Case': return this.case;
                case 'GoalType':
                    return this.goalType(command.normalization);
                case 'Context':
                    return this.context(command.normalization);
                case 'GoalTypeAndContext':
                    return this.goalTypeAndContext(command.normalization);
                case 'GoalTypeAndInferredType':
                    return this.goalTypeAndInferredType(command.normalization);
                case 'InputSymbol': return this.inputSymbol;
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
                case 'QuerySymbol': return this.querySymbol;
                default: throw `undispatched command type\n${JSON.stringify(command)}`;
            }
        };
        //
        //  Commands
        //
        this.load = (conn) => {
            // force save before load
            return this.core.editor.save()
                .then(() => conn)
                .then(Req.load)
                .then(result => {
                this.loaded = true;
                return result;
            });
        };
        this.quit = (conn) => {
            this.core.view.deactivatePanel();
            const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
            this.core.view.unmountPanel(currentMountingPosition);
            if (this.loaded) {
                this.loaded = false;
                this.core.editor.goal.removeAll();
                this.core.editor.highlighting.destroyAll();
                this.core.connection.disconnect();
            }
            return Promise.resolve([]);
        };
        this.restart = (conn) => {
            return this.quit(conn)
                .then(() => conn)
                .then(this.load);
        };
        this.toggleDocking = (conn) => {
            return this.core.view.toggleDocking()
                .then(() => Promise.resolve([]));
        };
        this.compile = Req.compile;
        this.toggleDisplayOfImplicitArguments = Req.toggleDisplayOfImplicitArguments;
        this.solveConstraints = Req.solveConstraints('Instantiated');
        this.showConstraints = Req.showConstraints;
        this.showGoals = Req.showGoals;
        this.nextGoal = (conn) => {
            return this.core.editor.jumpToNextGoal()
                .then(() => Promise.resolve([]));
        };
        this.previousGoal = (conn) => {
            return this.core.editor.jumpToPreviousGoal()
                .then(() => Promise.resolve([]));
        };
        //
        //  The following commands may have a goal-specific version
        //
        this.whyInScope = (conn) => {
            return this.core.view.query('Scope info', [], 0 /* PlainText */, 'name:')
                .then((expr) => {
                return this.core.editor.goal.pointing()
                    .then(goal => Req.whyInScope(expr, goal)(conn))
                    .catch(Err.OutOfGoalError, () => Req.whyInScopeGlobal(expr)(conn));
            });
        };
        this.inferType = (normalization) => (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                        .then(expr => Req.inferType(normalization, expr, goal)(conn));
                }
                else {
                    return Req.inferType(normalization, goal.getContent(), goal)(conn);
                }
            })
                .catch(() => {
                // global command
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 0 /* PlainText */, 'expression to infer:')
                    .then(expr => Req.inferTypeGlobal(normalization, expr)(conn));
            });
        };
        this.moduleContents = (normalization) => (conn) => {
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
        this.computeNormalForm = (computeMode) => (conn) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                        .then(expr => Req.computeNormalForm(computeMode, expr, goal)(conn));
                }
                else {
                    return Req.computeNormalForm(computeMode, goal.getContent(), goal)(conn);
                }
            })
                .catch(Err.OutOfGoalError, () => {
                return this.core.view.query(`Compute normal form`, [], 0 /* PlainText */, 'expression to normalize:')
                    .then(expr => Req.computeNormalFormGlobal(computeMode, expr)(conn));
            });
        };
        //
        //  The following commands only working in the context of a specific goal
        //
        this.give = (conn) => {
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
                .then(goal => Req.give(goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.refine = (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.refine(goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.auto = (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.auto(goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.case = (conn) => {
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
                .then(goal => Req.makeCase(goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.goalType = (normalization) => (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.goalType(normalization, goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.context = (normalization) => (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.context(normalization, goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.goalTypeAndContext = (normalization) => (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.goalTypeAndContext(normalization, goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.goalTypeAndInferredType = (normalization) => (conn) => {
            return this.core.editor.goal.pointing()
                .then(goal => Req.goalTypeAndInferredType(normalization, goal)(conn))
                .catch(Err.OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], 3 /* Error */);
                return [];
            });
        };
        this.inputSymbol = (conn) => {
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
        };
        this.querySymbol = (conn) => {
            return this.core.view.query(`Query Unicode symbol input sequences`, [], 0 /* PlainText */, 'symbol:')
                .then(symbol => {
                const sequences = query_1.default[symbol.codePointAt(0)] || [];
                this.core.view.set(`Input sequence for ${symbol}`, sequences, 0 /* PlainText */);
                return [];
            });
        };
        this.inputSymbolInterceptKey = (kind, key) => (conn) => {
            this.core.inputMethod.interceptAndInsertKey(key);
            return Promise.resolve([]);
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