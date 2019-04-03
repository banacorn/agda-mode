import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as Err from './error';
// import { OutOfGoalError, EmptyGoalError, NotLoadedError, InvalidExecutablePathError } from './error';
import { View, Agda } from './type';
import { Connection } from './type/connection';
import { handleResponses } from './response-handler';
import { Core } from './core';
import * as Req from './request';
import * as Action from './view/actions';
import TableDefault from './asset/query';
import * as Atom from 'atom';

let Table = TableDefault
let inputTriePath = atom.config.get('agda-mode.inputTriePath')
if (inputTriePath) {
  try {
    const file = new Atom.File(inputTriePath + 'query.json')
    file.read()
      .then(str => Table = JSON.parse(str))
      .then(_ => console.log('successful query change yay!!'))
  } catch (err) {
    console.log(err)
  }
}

function toDescription(normalization: Agda.Normalization): string {
    switch(normalization) {
        case 'Simplified':      return '';
        case 'Instantiated':    return '(no normalization)';
        case 'Normalised':      return '(full normalization)';
        default:                throw `unknown normalization: ${normalization}`;
    }
}

export default class Commander {
    private loaded: boolean;
    public currentCommand: Agda.Command;

    private history: {
        checkpoints: number[];  // checkpoint stack
        reload: boolean;        // should reload to reconcile goals
    };

    constructor(private core: Core) {
        this.loaded = false;

        this.dispatchCommand = this.dispatchCommand.bind(this);
        this.startCheckpoint = this.startCheckpoint.bind(this);
        this.endCheckpoint = this.endCheckpoint.bind(this);

        this.history = {
            checkpoints: [],
            reload: false
        };
    }

    //
    //  History Management
    //

    // sometimes a child command may be invoked by some parent command,
    // in that case, both the parent and the child command should be
    // regarded as a single action

    private startCheckpoint = (command: Agda.Command) => (connection: Connection): Connection => {
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
    }

    private endCheckpoint = () => {
        const checkpoint = this.history.checkpoints.pop();
        // group changes if it's a parent command
        if (this.history.checkpoints.length === 0) { // popped
            this.core.editor.getTextEditor().groupChangesSinceCheckpoint(checkpoint);
        }
    }

    //
    //  Dispatchers
    //

    dispatchUndo = () => {
        // reset goals after undo
        this.core.editor.getTextEditor().undo();
        // reload
        if (this.history.reload)
            this.dispatch({ kind: 'Load' });
    }

    dispatch = (command: Agda.Command): Promise<void> => {
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
                .then(handleResponses(this.core))
                .catch(Err.QueryCancelled, () => {
                    this.core.view.setPlainText('Query cancelled', '', View.Style.Warning);
                })
                .catch(this.core.connection.handleAgdaError)
        } else {
            return this.core.connection.getConnection()
                .catch(Err.Conn.NotEstablished, () => {
                    if (activationCommands) {
                        // activate the view first
                        const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                        this.core.view.mountPanel(currentMountingPosition);
                        this.core.view.activatePanel();

                        if (command.kind === 'Load') {
                            this.core.view.setPlainText('Loading ...', '');
                        } else {
                            this.core.view.setPlainText('Type Checking ...', '');
                        }
                    }
                    // initialize connection
                    return this.core.connection.connect();
                })
                .then(this.startCheckpoint(command))
                .then(this.dispatchCommand(command))
                .then(this.sendRequests)
                .then(handleResponses(this.core))
                .finally(this.endCheckpoint)
                .catch(this.core.connection.handleAgdaError);
        }
    }

    private dispatchCommand = (command: Agda.Command) => (connection: Connection): Promise<Agda.Request[]> => {
        switch(command.kind) {
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
                throw `undispatched command type\n${JSON.stringify(command)}`
        }
    }

    sendRequests = (requests: Agda.Request[]): Promise<Agda.Response[]> => {
        return Promise.map(requests, (request) => {
            // pushing the unfullfilled request to the back of the backlog queue of Connection
            const promise = new Promise<Agda.Response[]>((resolve, reject) => {
                request.connection.queue.unshift({ resolve, reject });
            });

            this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                parsed: request,
                raw: request.body
            }));
            this.core.view.store.dispatch(Action.PROTOCOL.pending(true));
            // send it out
            request.connection.stream.write(request.body);
            return promise;
        }).then(responses => _.flatten(responses));
    }

    //
    //  Commands
    //
    private load = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        // destroy running info editor before reloading
        this.core.editor.runningInfo.destroy();
        // force save before load
        return this.core.editor.save()
            .then(() => {
                this.loaded = true;
                return [Req.load(command, connection)];
            });
    }

    private quit = (): Promise<Agda.Request[]> => {
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
    }

    private restart = (connection: Connection): Promise<Agda.Request[]> => {
        return this.quit()
            .then(() => this.dispatch({ kind: 'Load' }))
            .then(() => []);
    }

    private abort = Req.abort;

    private toggleDocking = (): Promise<Agda.Request[]> => {
        return this.core.view.toggleDocking()
            .then(() => []);
    }

    private compile = Req.compile;
    private toggleDisplayOfImplicitArguments = Req.toggleDisplayOfImplicitArguments;
    private solveConstraints = Req.solveConstraints('Instantiated')
    private showConstraints = Req.showConstraints
    private showGoals = Req.showGoals

    private nextGoal = (): Promise<Agda.Request[]> => {
        return this.core.editor.jumpToNextGoal()
            .then(() => []);
    }

    private previousGoal = (): Promise<Agda.Request[]> => {
        return this.core.editor.jumpToPreviousGoal()
            .then(() => []);
    }

    //
    //  The following commands may have a goal-specific version
    //

    private searchAbout = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.view.query(`Searching through definitions ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
            .then(expr => [Req.searchAbout(normalization, expr)(command, connection)])
    }

    private whyInScope = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        const selectedText = this.core.editor.getTextEditor().getSelectedText();
        if (selectedText) {
            return Promise.resolve([Req.whyInScopeGlobal(selectedText)(command, connection)])
        } else {
            return this.core.view.query('Scope info', [], View.Style.PlainText, 'name:')
                .then((expr) => {
                    return this.core.editor.goal.pointing()
                        .then(goal => [Req.whyInScope(expr, goal)(command, connection)])
                        .catch(Err.OutOfGoalError, () => [Req.whyInScopeGlobal(expr)(command, connection)])
                });
        }
    }

    private inferType = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
                        .then(expr => [Req.inferType(normalization, expr, goal)(command, connection)])
                } else {
                    return [Req.inferType(normalization, goal.getContent(), goal)(command, connection)];
                }
            })
            .catch(() => {
                // global command
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
                    .then(expr => [Req.inferTypeGlobal(normalization, expr)(command, connection)])
            })
    }


    private moduleContents = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], View.Style.PlainText, 'module name:')
            .then(expr => {
                return this.core.editor.goal.pointing()
                    .then(goal => [Req.moduleContents(normalization, expr, goal)(command, connection)])
                    .catch(() => [Req.moduleContentsGlobal(normalization, expr)(command, connection)])
            });
    }


    private computeNormalForm = (computeMode: Agda.ComputeMode) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query(`Compute normal form`, [], View.Style.PlainText, 'expression to normalize:')
                        .then(expr => [Req.computeNormalForm(computeMode, expr, goal)(command, connection)])
                } else {
                    return [Req.computeNormalForm(computeMode, goal.getContent(), goal)(command, connection)]
                }
            })
            .catch(Err.OutOfGoalError, () => {
                return this.core.view.query(`Compute normal form`, [], View.Style.PlainText, 'expression to normalize:')
                    .then(expr => [Req.computeNormalFormGlobal(computeMode, expr)(command, connection)])
            })

    }

    //
    //  The following commands only working in the context of a specific goal
    //

    private give = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Give', [], View.Style.PlainText, 'expression to give:')
                        .then(goal.setContent);
                } else {
                    return goal;
                }
            })
            .then(goal => [Req.give(goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Give` is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private refine = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => [Req.refine(goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Refine` is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private auto = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => [Req.auto(goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Auto` is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private case = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Case', [], View.Style.PlainText, 'the argument to case:')
                        .then(goal.setContent);
                } else {
                    return goal;
                }
            })
            .then(goal => [Req.makeCase(goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '`Case` is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private goalType = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => [Req.goalType(normalization, goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Goal Type" is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private context = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => [Req.context(normalization, goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Context" is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private goalTypeAndContext = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => [Req.goalTypeAndContext(normalization, goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Goal Type & Context" is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            })
    }

    private goalTypeAndInferredType = (normalization: Agda.Normalization) => (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        return this.core.editor.goal.pointing()
            .then(goal => [Req.goalTypeAndInferredType(normalization, goal)(command, connection)])
            .catch(Err.OutOfGoalError, () => {
                this.core.view.setPlainText('Out of goal', '"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal', View.Style.Error);
                return [];
            });
    }

    private inputSymbol = (): Promise<Agda.Request[]> => {
        if (atom.config.get('agda-mode.inputMethod')) {
            if (!this.loaded) {
                const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                this.core.view.mountPanel(currentMountingPosition);
                this.core.view.activatePanel();
                this.core.view.setPlainText('Not loaded', '', View.Style.PlainText);
            }
            this.core.inputMethod.activate();
        } else {
            this.core.view.editors.getFocusedEditor().then(editor => editor.insertText('\\'));
        }
        return Promise.resolve([]);
    }

    private querySymbol = (): Promise<Agda.Request[]> => {
        const selectedText = this.core.editor.getTextEditor().getSelectedText();
        console.log('selectedText', selectedText)
        if (selectedText.length > 0) {
            const symbol = selectedText[0];
            console.log('symbol', symbol)
            const sequences: string[] = Table[symbol.codePointAt(0)] || [];
            console.log('sequences', sequences)
            this.core.view.setPlainText(
                `Input sequence for ${symbol}`,
                sequences.toString(),
                View.Style.PlainText);
            return Promise.resolve([]);
        } else {
            return this.core.view.query(`Query Unicode symbol input sequences`, [], View.Style.PlainText, 'symbol:')
                .then(symbol => {
                    const sequences: string[] = Table[symbol.codePointAt(0)] || [];
                    this.core.view.setPlainText(
                        `Input sequence for ${symbol}`,
                        sequences.toString(),
                        View.Style.PlainText);
                    return [];
                });
        }
    }

    private gotoDefinition = (command: Agda.Command, connection: Connection): Promise<Agda.Request[]> => {
        if (this.loaded) {
            // select and return the text of larger syntax node unless already selected
            var name;
            const selected = this.core.editor.getTextEditor().getSelectedText();
            if (selected) {
                name = selected;
            } else {
                this.core.editor.getTextEditor().selectLargerSyntaxNode();
                name = this.core.editor.getTextEditor().getSelectedText();

                // this happens when language-agda is not installed
                if (name.length === 0) {
                    this.core.editor.getTextEditor().selectWordsContainingCursors()
                    name = this.core.editor.getTextEditor().getSelectedText();
                }

            }
            return this.core.editor.goal.pointing()
                .then(goal => [Req.gotoDefinition(name, goal)(command, connection)])
                .catch(Err.OutOfGoalError, () => [Req.gotoDefinitionGlobal(name)(command, connection)])
        } else {
            return this.dispatch({ kind: 'Load' })
                .then(() => {
                    this.currentCommand = command;
                    return this.gotoDefinition(command, connection)
                })
        }
    }

    private inputSymbolInterceptKey = (_, key: string) => (): Promise<Agda.Request[]> => {
        this.core.inputMethod.interceptAndInsertKey(key);
        return Promise.resolve([]);
    }
}
