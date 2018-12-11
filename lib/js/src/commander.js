"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const Err = require("./error");
const response_handler_1 = require("./response-handler");
const Req = require("./request");
const Action = require("./view/actions");
const query_1 = require("./asset/query");
const ViewRE = require('./Reason/View.bs');
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
            if (this.history.checkpoints.length === 0) { // popped
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
            // register current command
            this.currentCommand = command;
            // activation commands
            const activationCommands = _.includes([
                'Load',
                'GotoDefinition',
            ], command.kind);
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
                    .then(this.sendRequests)
                    .then(response_handler_1.handleResponses(this.core))
                    .catch(Err.QueryCancelled, () => {
                    this.core.view.setPlainText('Query cancelled', '', 'warning');
                })
                    .catch(this.core.connection.handleAgdaError);
            }
            else {
                return this.core.connection.getConnection()
                    .catch(Err.Conn.NotEstablished, () => {
                    if (activationCommands) {
                        // activate the view first
                        // const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                        // this.core.view.mountPanel(currentMountingPosition);
                        // this.core.view.activatePanel();
                        ViewRE.jsMountPanel("bottom");
                        if (command.kind === 'Load') {
                            this.core.view.setPlainText('Type Checking ...', '');
                        }
                        else {
                            this.core.view.setPlainText('Loading ...', '');
                        }
                    }
                    // initialize connection
                    return this.core.connection.connect();
                })
                    .then(this.startCheckpoint(command))
                    .then(this.dispatchCommand(command))
                    .then(this.sendRequests)
                    .then(response_handler_1.handleResponses(this.core))
                    .finally(this.endCheckpoint)
                    .catch(this.core.connection.handleAgdaError);
            }
        };
        this.dispatchCommand = (command) => (connection) => {
            switch (command.kind) {
                case 'Load':
                    return this.load(command, connection);
                case 'Quit':
                    return this.quit();
                case 'Restart':
                    return this.restart(connection);
                case 'Abort':
                    return Promise.resolve([this.abort(command, connection)]);
                case 'ToggleDocking':
                    return this.toggleDocking();
                case 'Compile':
                    return Promise.resolve([this.compile(command, connection)]);
                case 'ToggleDisplayOfImplicitArguments':
                    return Promise.resolve([this.toggleDisplayOfImplicitArguments(command, connection)]);
                case 'SolveConstraints':
                    return Promise.resolve([this.solveConstraints(command, connection)]);
                case 'ShowConstraints':
                    return Promise.resolve([this.showConstraints(command, connection)]);
                case 'ShowGoals':
                    return Promise.resolve([this.showGoals(command, connection)]);
                case 'NextGoal':
                    return this.nextGoal();
                case 'PreviousGoal':
                    return this.previousGoal();
                case 'SearchAbout':
                    return this.searchAbout(command.normalization)(command, connection);
                case 'WhyInScope':
                    return this.whyInScope(command, connection);
                case 'InferType':
                    return this.inferType(command.normalization)(command, connection);
                case 'ModuleContents':
                    return this.moduleContents(command.normalization)(command, connection);
                case 'ComputeNormalForm':
                    return this.computeNormalForm(command.computeMode)(command, connection);
                case 'Give':
                    return this.give(command, connection);
                case 'Refine':
                    return this.refine(command, connection);
                case 'Auto':
                    return this.auto(command, connection);
                case 'Case':
                    return this.case(command, connection);
                case 'GoalType':
                    return this.goalType(command.normalization)(command, connection);
                case 'Context':
                    return this.context(command.normalization)(command, connection);
                case 'GoalTypeAndContext':
                    return this.goalTypeAndContext(command.normalization)(command, connection);
                case 'GoalTypeAndInferredType':
                    return this.goalTypeAndInferredType(command.normalization)(command, connection);
                case 'InputSymbol':
                    return this.inputSymbol();
                case 'InputSymbolCurlyBracket':
                    return this.inputSymbolInterceptKey(command.kind, '{')();
                case 'InputSymbolBracket':
                    return this.inputSymbolInterceptKey(command.kind, '[')();
                case 'InputSymbolParenthesis':
                    return this.inputSymbolInterceptKey(command.kind, '(')();
                case 'InputSymbolDoubleQuote':
                    return this.inputSymbolInterceptKey(command.kind, '"')();
                case 'InputSymbolSingleQuote':
                    return this.inputSymbolInterceptKey(command.kind, '\'')();
                case 'InputSymbolBackQuote':
                    return this.inputSymbolInterceptKey(command.kind, '`')();
                case 'QuerySymbol':
                    return this.querySymbol();
                case 'GotoDefinition':
                    return this.gotoDefinition(command, connection);
                default:
                    throw `undispatched command type\n${JSON.stringify(command)}`;
            }
        };
        this.sendRequests = (requests) => {
            return Promise.map(requests, (request) => {
                // pushing the unfullfilled request to the back of the backlog queue of Connection
                const promise = new Promise((resolve, reject) => {
                    request.connection.queue.unshift({ resolve, reject });
                });
                this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                    parsed: request,
                    raw: request.body
                }));
                this.core.view.isPending(true);
                // send it out
                request.connection.stream.write(request.body);
                return promise;
            }).then(responses => _.flatten(responses));
        };
        //
        //  Commands
        //
        this.load = (command, connection) => {
            // destroy running info editor before reloading
            this.core.editor.runningInfo.destroy();
            // force save before load
            return this.core.editor.save()
                .then(() => {
                this.loaded = true;
                return [Req.load(command, connection)];
            });
        };
        this.quit = () => {
            // this.core.view.deactivatePanel();
            // const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
            // this.core.view.unmountPanel(currentMountingPosition);
            ViewRE.jsMountPanel("nowhere");
            if (this.loaded) {
                this.loaded = false;
                this.core.editor.goal.removeAll();
                this.core.editor.highlighting.destroyAll();
                this.core.connection.disconnect();
            }
            return Promise.resolve([]);
        };
        this.restart = (connection) => {
            return this.quit()
                .then(() => this.dispatch({ kind: 'Load' }))
                .then(() => []);
        };
        this.abort = Req.abort;
        this.toggleDocking = () => {
            return this.core.view.toggleDocking()
                .then(() => []);
        };
        this.compile = Req.compile;
        this.toggleDisplayOfImplicitArguments = Req.toggleDisplayOfImplicitArguments;
        this.solveConstraints = Req.solveConstraints('Instantiated');
        this.showConstraints = Req.showConstraints;
        this.showGoals = Req.showGoals;
        this.nextGoal = () => {
            return this.core.editor.jumpToNextGoal()
                .then(() => []);
        };
        this.previousGoal = () => {
            return this.core.editor.jumpToPreviousGoal()
                .then(() => []);
        };
        //
        //  The following commands may have a goal-specific version
        //
        this.searchAbout = (normalization) => (command, connection) => {
            return this.core.view.query(`Searching through definitions ${toDescription(normalization)}`, [], 'expression to infer:')
                .then(expr => [Req.searchAbout(normalization, expr)(command, connection)]);
        };
        this.whyInScope = (command, connection) => {
            const selectedText = this.core.editor.getTextEditor().getSelectedText();
            if (selectedText) {
                return Promise.resolve([Req.whyInScopeGlobal(selectedText)(command, connection)]);
            }
            else {
                return this.core.view.query('Scope info', [], 'name:')
                    .then((expr) => {
                    return this.core.editor.goal.pointing()
                        .then(goal => [Req.whyInScope(expr, goal)(command, connection)])
                        .catch(Err.OutOfGoalError, () => [Req.whyInScopeGlobal(expr)(command, connection)]);
                });
            }
        };
        this.inferType = (normalization) => (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 'expression to infer:')
                        .then(expr => [Req.inferType(normalization, expr, goal)(command, connection)]);
                }
                else {
                    return [Req.inferType(normalization, goal.getContent(), goal)(command, connection)];
                }
            })
                .catch(() => {
                // global command
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], 'expression to infer:')
                    .then(expr => [Req.inferTypeGlobal(normalization, expr)(command, connection)]);
            });
        };
        this.moduleContents = (normalization) => (command, connection) => {
            return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], 'module name:')
                .then(expr => {
                return this.core.editor.goal.pointing()
                    .then(goal => [Req.moduleContents(normalization, expr, goal)(command, connection)])
                    .catch(() => [Req.moduleContentsGlobal(normalization, expr)(command, connection)]);
            });
        };
        this.computeNormalForm = (computeMode) => (command, connection) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query(`Compute normal form`, [], 'expression to normalize:')
                        .then(expr => [Req.computeNormalForm(computeMode, expr, goal)(command, connection)]);
                }
                else {
                    return [Req.computeNormalForm(computeMode, goal.getContent(), goal)(command, connection)];
                }
            })
                .catch(Err.OutOfGoalError, () => {
                return this.core.view.query(`Compute normal form`, [], 'expression to normalize:')
                    .then(expr => [Req.computeNormalFormGlobal(computeMode, expr)(command, connection)]);
            });
        };
        //
        //  The following commands only working in the context of a specific goal
        //
        this.give = (command, connection) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Give', [], 'expression to give:')
                        .then(goal.setContent);
                }
                else {
                    return goal;
                }
            })
                .then(goal => [Req.give(goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Give` is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.refine = (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => [Req.refine(goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Refine` is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.auto = (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => [Req.auto(goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Auto` is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.case = (command, connection) => {
            return this.core.editor.goal.pointing()
                .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Case', [], 'the argument to case:')
                        .then(goal.setContent);
                }
                else {
                    return goal;
                }
            })
                .then(goal => [Req.makeCase(goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Case` is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.goalType = (normalization) => (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => [Req.goalType(normalization, goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Goal Type" is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.context = (normalization) => (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => [Req.context(normalization, goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Context" is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.goalTypeAndContext = (normalization) => (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => [Req.goalTypeAndContext(normalization, goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Goal Type & Context" is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.goalTypeAndInferredType = (normalization) => (command, connection) => {
            return this.core.editor.goal.pointing()
                .then(goal => [Req.goalTypeAndInferredType(normalization, goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal', 'error');
                return [];
            });
        };
        this.inputSymbol = () => {
            if (atom.config.get('agda-mode.inputMethod')) {
                if (!this.loaded) {
                    // const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                    // this.core.view.mountPanel(currentMountingPosition);
                    // this.core.view.activatePanel();
                    ViewRE.jsMountPanel("bottom");
                    this.core.view.setPlainText('Not loaded', '');
                }
                ViewRE.jsActivateInputMethod();
                this.core.inputMethod.activate();
            }
            else {
                this.core.view.editors.getFocusedEditor().then(editor => editor.insertText('\\'));
            }
            return Promise.resolve([]);
        };
        this.querySymbol = () => {
            const selectedText = this.core.editor.getTextEditor().getSelectedText();
            if (selectedText.length > 0) {
                const symbol = selectedText[0];
                const sequences = query_1.default[symbol.codePointAt(0)] || [];
                this.core.view.setPlainText(`Input sequence for ${symbol}`, sequences);
                return Promise.resolve([]);
            }
            else {
                return this.core.view.query(`Query Unicode symbol input sequences`, [], 'symbol:')
                    .then(symbol => {
                    const sequences = query_1.default[symbol.codePointAt(0)] || [];
                    this.core.view.setPlainText(`Input sequence for ${symbol}`, sequences);
                    return [];
                });
            }
        };
        this.gotoDefinition = (command, connection) => {
            if (this.loaded) {
                // select and return the text of larger syntax node unless already selected
                var name;
                const selected = this.core.editor.getTextEditor().getSelectedText();
                if (selected) {
                    name = selected;
                }
                else {
                    this.core.editor.getTextEditor().selectLargerSyntaxNode();
                    name = this.core.editor.getTextEditor().getSelectedText();
                    // this happens when language-agda is not installed
                    if (name.length === 0) {
                        this.core.editor.getTextEditor().selectWordsContainingCursors();
                        name = this.core.editor.getTextEditor().getSelectedText();
                    }
                }
                return this.core.editor.goal.pointing()
                    .then(goal => [Req.gotoDefinition(name, goal)(command, connection)])
                    .catch(Err.OutOfGoalError, () => [Req.gotoDefinitionGlobal(name)(command, connection)]);
            }
            else {
                return this.dispatch({ kind: 'Load' })
                    .then(() => {
                    this.currentCommand = command;
                    return this.gotoDefinition(command, connection);
                });
            }
        };
        this.inputSymbolInterceptKey = (_, key) => () => {
            ViewRE.jsInterceptAndInsertKey(key);
            this.core.inputMethod.interceptAndInsertKey(key);
            return Promise.resolve([]);
        };
        this.loaded = false;
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