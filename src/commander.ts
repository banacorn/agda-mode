import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { inspect } from 'util';
import { OutOfGoalError, EmptyGoalError, QueryCancelled, NotLoadedError, InvalidExecutablePathError } from './error';
import { View, Agda, Connection } from './type';
import { handleResponses } from './response-handler';
import Core from './core';
import * as Req from './request';
import * as Action from './view/actions';

declare var atom: any;


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

    constructor(private core: Core) {
        this.dispatchCommand = this.dispatchCommand.bind(this);
    }

    dispatch = (command: Agda.Command): Promise<void> => {
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
            if (command.kind === 'Load') {
                // activate the view first
                const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                this.core.view.mountPanel(currentMountingPosition);
                this.core.view.activatePanel();
                return this.core.connector.connect()
                    .then(conn => {
                        return conn
                    })
                    .then(this.dispatchCommand(command))
                    .then(handleResponses(this.core))
                    .catch(this.core.connector.handleError)
            } else {
                return this.core.connector.getConnection()
                    .then(this.dispatchCommand(command))
                    .then(handleResponses(this.core))
            }
        }
    }

    private dispatchCommand = (command: Agda.Command): (conn: Connection) => Promise<Agda.Response[]> => {
        switch(command.kind) {
            case 'Load':          return this.load;
            case 'Quit':          return this.quit;
            case 'Restart':       return this.restart;
            case 'Info':          return this.info;
            case 'ToggleDocking': return this.toggleDocking;
            case 'Compile':       return this.compile;
            case 'ToggleDisplayOfImplicitArguments':
                return this.toggleDisplayOfImplicitArguments;
            case 'SolveConstraints':
                return this.solveConstraints;
            case 'ShowConstraints':
                return this.showConstraints;
            case 'ShowGoals':
                return this.showGoals;
            case 'NextGoal':      return this.nextGoal;
            case 'PreviousGoal':  return this.previousGoal;
            case 'WhyInScope':    return this.whyInScope;
            case 'InferType':
                return this.inferType(command.normalization);
            case 'ModuleContents':
                return this.moduleContents(command.normalization);
            case 'ComputeNormalForm':
                return this.computeNormalForm(command.computeMode);
            case 'Give':          return this.give;
            case 'Refine':        return this.refine;
            case 'Auto':          return this.auto;
            case 'Case':          return this.case;
            case 'GoalType':
                return this.goalType(command.normalization);
            case 'Context':
                return this.context(command.normalization);
            case 'GoalTypeAndContext':
                return this.goalTypeAndContext(command.normalization);
            case 'GoalTypeAndInferredType':
                return this.goalTypeAndInferredType(command.normalization);
            case 'InputSymbol':   return this.inputSymbol;
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
            default:    throw `undispatched command type\n${JSON.stringify(command)}`
        }
    }

    //
    //  Commands
    //
    private load = (conn: Connection): Promise<Agda.Response[]> => {
        // force save before load
        return this.core.saveEditor()
            .then(() => conn)
            .then(Req.load)
            .then(result => {
                this.loaded = true;
                return result;
            })

    }

    private quit = (conn: Connection): Promise<Agda.Response[]> => {
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

    private restart = (conn: Connection): Promise<Agda.Response[]> => {
        return this.quit(conn)
            .then(() => conn)
            .then(this.load);
    }

    private info = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.connector
            .getConnection()
            .then(conn => {
                this.core.view.set('Info', [
                    `Agda version: ${conn.agda.version.raw}`,
                    `Agda executable path: ${conn.agda.location}`
                    // `Agda executable arguments: ${args.join(' ')}`
                ], View.Style.PlainText);

                return [];
            });
    }

    private toggleDocking = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.view.toggleDocking()
            .then(() => Promise.resolve([]));
    }

    private compile = Req.compile;
    private toggleDisplayOfImplicitArguments = Req.toggleDisplayOfImplicitArguments;
    private solveConstraints = Req.solveConstraints('Instantiated')
    private showConstraints = Req.showConstraints
    private showGoals = Req.showGoals

    private nextGoal = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.nextGoal()
            .then(() => Promise.resolve([]));
    }

    private previousGoal = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.previousGoal()
            .then(() => Promise.resolve([]));
    }

    //
    //  The following commands may have a goal-specific version
    //

    private whyInScope = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.view.query('Scope info', [], View.Style.PlainText, 'name:')
            .then((expr) => {
                return this.core.textBuffer.getCurrentGoal()
                    .then(goal => Req.whyInScope(expr, goal)(conn))
                    .catch(OutOfGoalError, () => Req.whyInScopeGlobal(expr)(conn))
            });
    }

    private inferType = (normalization: Agda.Normalization) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => {
                // goal-specific
                if (goal.isEmpty()) {
                    return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
                        .then(expr => Req.inferType(normalization, expr, goal)(conn))
                } else {
                    return Req.inferType(normalization, goal.getContent(), goal)(conn);
                }
            })
            .catch(() => {
                // global command
                return this.core.view.query(`Infer type ${toDescription(normalization)}`, [], View.Style.PlainText, 'expression to infer:')
                    .then(expr => Req.inferTypeGlobal(normalization, expr)(conn))
            })
    }


    private moduleContents = (normalization: Agda.Normalization) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.view.query(`Module contents ${toDescription(normalization)}`, [], View.Style.PlainText, 'module name:')
            .then(expr => {
                return this.core.textBuffer.getCurrentGoal()
                    .then(goal => this.core.connector
                        .getConnection()
                        .then(Req.moduleContents(normalization, expr, goal))
                    )
                    .catch((error) => {
                        return this.core.connector
                            .getConnection()
                            .then(Req.moduleContentsGlobal(normalization, expr))
                    });
            })
    }


    private computeNormalForm = (computeMode: Agda.ComputeMode) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query(`Compute normal form`, [], View.Style.PlainText, 'expression to normalize:')
                        .then(expr => Req.computeNormalForm(computeMode, expr, goal)(conn))
                } else {
                    return Req.computeNormalForm(computeMode, goal.getContent(), goal)(conn)
                }
            })
            .catch(OutOfGoalError, () => {
                return this.core.view.query(`Compute normal form`, [], View.Style.PlainText, 'expression to normalize:')
                    .then(expr => Req.computeNormalFormGlobal(computeMode, expr)(conn))
            })

    }

    //
    //  The following commands only working in the context of a specific goal
    //

    private give = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Give', [], View.Style.PlainText, 'expression to give:')
                        .then(goal.setContent);
                } else {
                    return goal;
                }
            })
            .then(goal => Req.give(goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Give` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private refine = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => Req.refine(goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Refine` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private auto = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => Req.auto(goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Auto` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private case = (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then((goal) => {
                if (goal.isEmpty()) {
                    return this.core.view.query('Case', [], View.Style.PlainText, 'the argument to case:')
                        .then(goal.setContent);
                } else {
                    return goal;
                }
            })
            .then(goal => Req.makeCase(goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['`Case` is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private goalType = (normalization: Agda.Normalization) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => Req.goalType(normalization, goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private context = (normalization: Agda.Normalization) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => Req.context(normalization, goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Context" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private goalTypeAndContext = (normalization: Agda.Normalization) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => Req.goalTypeAndContext(normalization, goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Context" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private goalTypeAndInferredType = (normalization: Agda.Normalization) => (conn: Connection): Promise<Agda.Response[]> => {
        return this.core.textBuffer.getCurrentGoal()
            .then(goal => Req.goalTypeAndInferredType(normalization, goal)(conn))
            .catch(OutOfGoalError, () => {
                this.core.view.set('Out of goal', ['"Goal Type & Inferred Type" is a goal-specific command, please place the cursor in a goal'], View.Style.Error);
                return []
            })
    }

    private inputSymbol = (conn: Connection): Promise<Agda.Response[]> => {
        // const miniEditorFocused = this.core.view.editors.general && this.core.view.editors.general.isFocused();
        // const shouldNotActivate = miniEditorFocused && !enableInMiniEditor;

        const shouldNotActivate = this.core.view.editors.focused() === 'connection';
        if (atom.config.get('agda-mode.inputMethod') && !shouldNotActivate) {
            if (!this.loaded) {
                const currentMountingPosition = this.core.view.store.getState().view.mountAt.current;
                this.core.view.mountPanel(currentMountingPosition);
                this.core.view.activatePanel();
                this.core.view.set('Not loaded', [], View.Style.PlainText);
            }
            this.core.inputMethod.activate();
        } else {
            this.core.view.editors.getFocusedEditorElement().insertText('\\');
        }
        return Promise.resolve([]);
    }

    private inputSymbolInterceptKey = (kind, key: string) => (conn: Connection): Promise<Agda.Response[]> => {
        this.core.inputMethod.interceptAndInsertKey(key);
        return Promise.resolve([]);
    }
}
