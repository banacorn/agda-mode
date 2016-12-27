import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { spawn, exec, ChildProcess } from 'child_process';
import { parseFilepath, parseAgdaResponse } from './parser';
import Rectifier from './parser/stream/rectifier';
import { handleAgdaResponse } from './handler';
import { InvalidExecutablePathError, ProcExecError, AutoExecPathSearchError, AgdaParseError } from './error';
import { Goal, Normalization, ComputeMode, View } from './types';
import Core from './core';
import * as Action from './view/actions';

var semver = require('semver');
declare var atom: any;

Promise.longStackTraces();  // for debugging

export default class Process {

    private agdaProcessWired: boolean
    private agdaProcess: ChildProcess
    public agdaVersion: {
        raw: string,
        sem: string
    }

    constructor(private core: Core) {}

    getLibraryPath(): string {
        const path = atom.config.get('agda-mode.libraryPath');
        path.unshift('.');
        return path.map((p) => { return `\"${ parseFilepath(p) }\"`; }).join(', ');
    }

    getProgramArgs(): string[] {
        const args: string = atom.config.get('agda-mode.programArgs');
        return _.compact(args.split(' '));
    }

    // locate the path and see if it is truly a Agda process
    validateExecutablePath = (path: string): Promise<string> => {
        return new Promise((resolve: (string) => void, reject) => {
            path = parseFilepath(path) || '';
            if (path === '') {
                reject(new InvalidExecutablePathError(`Path must not be empty`, path));
            } else {
                try {
                    const args = this.getProgramArgs()
                    args.push('-V');
                    const agdaProcess = spawn(path, args);
                    agdaProcess.on('error', (error) => {
                        reject(new InvalidExecutablePathError(`unable to spawn Agda process`, path));
                    })
                    agdaProcess.stderr.once('data', (data) => {
                        let message = `Spawned process returned with the following result (from stderr):\n\"${data.toString()}\"`;
                        reject(new InvalidExecutablePathError(message, path));
                    });

                    agdaProcess.stdout.once('data', (data) => {
                        const result = data.toString().match(/^Agda version (.*)(?:\r\n?|\n)$/);
                        if (result) {
                            // normalize version number to valid semver
                            const rawVerNum = result[1];
                            const semVerNum = _.take((result[1] + '.0.0.0').replace('-', '.').split('.'), 3).join('.');
                            this.agdaVersion = {
                                raw: rawVerNum,
                                sem: semVerNum
                            };
                            atom.config.set('agda-mode.executablePath', path);
                            resolve(path);
                        } else {
                            let message = `Spawned process returned with the following result (from stdout):\n\"${data.toString()}\"`;
                            reject(new InvalidExecutablePathError(message, path));
                        }
                    });
                } catch (error) {
                    reject(new InvalidExecutablePathError(error.toString(), path));
                }
            }
        });
    }

    // keep banging the user until we got the right path
    queryExecutablePathUntilSuccess(error: AutoExecPathSearchError | InvalidExecutablePathError | ProcExecError): Promise<string> {
        let name: string;
        let message: string[];
        let type: View.Style;
        let placeholder: string;
        if (error.name === 'AutoExecPathSearchError') {
            name = `Automatic executable path searching failed`;
            message = [
                `searching for: \"${ error['programName'] }\" in the environment`
            ].concat(_.compact(error.message.split('\n')));
            type = View.Style.Warning;
            placeholder = 'please enter the path by manual or change the settings again';
        } else if (error.name === 'InvalidExecutablePathError') {
            name = `Invalid executable path`;
            message = [`Path: ${error['path']}`].concat(error.message.split('\n'));
            type = View.Style.Error;
            placeholder = 'try another path';
        } else if (error.name === 'ProcExecError') {
            name = `Process execution error`;
            message = error.message.split('\n');
            type = View.Style.Warning;
            placeholder = 'please enter the path by manual or change the settings again';
        }
        return this.core.view.query(name, message, type, placeholder, false) // disable input method in the mini editor
            .then(this.validateExecutablePath)
            .then((path) => {
                atom.config.set('agda-mode.executablePath', path)
                return path;
            })
            .catch(InvalidExecutablePathError, (error) => { return this.queryExecutablePathUntilSuccess(error) });
    }

    // if auto path searching is on,
    // then:
    //  1. get executable path from the settings
    //  2. else by the command 'which'
    //  3. else query the user until success
    // else:
    //  1. get executable path from the settings
    //  2. else query the user until success
    getExecutablePath(): Promise<string> {
        if (atom.config.get('agda-mode.autoSearchPath')) {
            return this.getPathFromSettings()                                               //  1
            .catch(InvalidExecutablePathError, () => { return this.autoGetPath(); })        //  2
            .catch((error) => { return this.queryExecutablePathUntilSuccess(error); })      //  3
        } else {
            return this.getPathFromSettings()                                               //  1
            .catch((error) => { return this.queryExecutablePathUntilSuccess(error); })      //  2
        }


    }

    // get executable path from settings and validate it
    getPathFromSettings(): Promise<string> {
        const path = atom.config.get('agda-mode.executablePath');
        return this.validateExecutablePath(path);
    }

    // get executable path by the command 'F'
    autoGetPath(): Promise<string> {
        return new Promise((resolve: (string) => void, reject) => {
            const onWindows = process.platform === 'win32';
            const programName = atom.config.get('agda-mode.programName');
            if (onWindows) {
                reject(new AutoExecPathSearchError('', programName));
            } else {
                exec(`which ${programName}`, (error, stdout, stderr) => {
                    if (error) {
                        // console.error(error);
                        reject(new AutoExecPathSearchError(error.toString(), programName));
                    } else {
                        resolve(this.validateExecutablePath(stdout));
                    }
                });
            }
        });
    }

    wireAgdaProcess(): Promise<ChildProcess> {
        if (this.agdaProcessWired) {
            return Promise.resolve(this.agdaProcess);
        } else {
            return this.getExecutablePath()
                .then((path) => {
                    return new Promise((resolve: (string) => void, reject) => {
                        // Agda program arguments
                        const args = this.getProgramArgs();
                        args.push('--interaction');
                        const agdaProcess = spawn(path, args);

                        // catch other forms of errors
                        agdaProcess.on('error', (error) => {
                            reject(new ProcExecError(error.message));
                        });

                        agdaProcess.on('close', (signal) => {
                            reject(new ProcExecError(`exit with signal ${signal}`));
                        });

                        agdaProcess.stdout.once('data', (data) => {
                            const result = data.toString().match(/^A/);
                            if (result) {
                                this.agdaProcessWired = true;
                                this.agdaProcess = agdaProcess;
                                resolve(agdaProcess);
                            } else {
                                reject(new AgdaParseError(data.toString()));
                            }
                        });

                        agdaProcess.stdout
                            .pipe(new Rectifier)
                            .on('data', (data) => {
                                try {
                                    if (atom.inDevMode()) {
                                        this.core.view.store.dispatch(Action.devAddResponse(data));
                                    }
                                    const response = parseAgdaResponse(data);
                                    handleAgdaResponse(this.core, response);
                                } catch (error) {
                                    console.log(error)
                                    // show some message
                                    this.core.view.set('Agda Parse Error',
                                        [`Message from agda:`].concat(data.toString()),
                                        View.Style.Error);
                                }
                            })
                    });
                });
        }
    }

    // COMMANDS

    // data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction' range)
    // data HighlightingLevel = None | NonInteractive | Interactive
    // data HighlightingMethod = Direct | Indirect
    //
    // data Range a = Range [Interval' a]
    // data Interval a = Interval { iStart, iEnd :: !(Position' a) }
    // data Position a = Pn a !Int32 !Int32 !Int32


    buildRange(goal: Goal): string {
        const start       = goal.range.start;
        const startIndex  = this.core.editor.toIndex(start);
        const end         = goal.range.end;
        const endIndex    = this.core.editor.toIndex(end);
        if (semver.gte(this.agdaVersion.sem, '2.5.1')) {
            return `(intervalsToRange (Just (mkAbsolute \"${this.core.getPath()}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
        } else {
            return `(Range [Interval (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
        }
    }


    private sendCommand = (highlightingLevel: string, interaction: string | (() => string)): Promise<ChildProcess> => {
        const filepath = this.core.getPath();
        const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
        let command: string;
        if (typeof interaction === 'string') {
            command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`
        } else {    // interaction is a callback
            command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction()} )\n`;
        }
        if (atom.inDevMode()) {
            this.core.view.store.dispatch(Action.devAddRequest(command));
        }
        this.agdaProcess.stdin.write(command);
        return Promise.resolve(this.agdaProcess);
    }

    load = (): Promise<ChildProcess> => {
        return this.wireAgdaProcess().then((agdaProcess) => {
            this.agdaProcess = agdaProcess;
            this.agdaProcessWired = true;
            // force save before load, since we are sending filepath but content
            this.core.textBuffer.saveBuffer();
            // if version > 2.5, ignore library path configuration
            return this.sendCommand('NonInteractive', () => {
                if (semver.gte(this.agdaVersion.sem, '2.5.0'))
                    return `Cmd_load \"${this.core.getPath()}\" []`
                else
                    return `Cmd_load \"${this.core.getPath()}\" [${this.getLibraryPath()}]`
            });
        }).catch(ProcExecError, (error) => {
            this.queryExecutablePathUntilSuccess(error);
        }).catch(AgdaParseError, (error) => {
            const args = this.getProgramArgs()
            args.push('-V');
            this.core.view.set(
                'Agda Parse Error', [
                    `Arguments passed to Agda: \"${args.join(' ')}\"`,
                    `Message from agda:`
                ].concat(error.message),
                View.Style.Error
            );
        });
    }

    quit = (): Promise<void> => {
        this.agdaProcess.kill();
        this.agdaProcessWired = false;
        return Promise.resolve();
    }

    info = (): Promise<void> => {
        const path = atom.config.get('agda-mode.executablePath');
        const args = this.getProgramArgs();
        args.push('--interaction');
        const agdaVersion = this.agdaVersion ? this.agdaVersion.raw : 'unknown';
        this.core.view.set('Info', [
            `Agda version: ${agdaVersion}`,
            `Agda executable path: ${path}`,
            `Agda executable arguments: ${args.join(' ')}`
        ], View.Style.PlainText);

        return Promise.resolve();
    }

    compile = (): Promise<ChildProcess> => {
        const backend = atom.config.get('agda-mode.backend');
        return this.sendCommand('NonInteractive', () => {
            if (semver.gte(this.agdaVersion.sem, '2.5.0'))
                return `Cmd_compile ${backend} \"${this.core.getPath()}\" []`
            else
                return `Cmd_compile ${backend} \"${this.core.getPath()}\" [${this.getLibraryPath()}]`
        })
    }

    toggleDisplayOfImplicitArguments = (): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', 'ToggleImplicitArgs');
    }

    solveConstraints = (): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', 'Cmd_solveAll');
    }

    showConstraints = (): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', 'Cmd_constraints');
    }

    showGoals = (): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', 'Cmd_metas');
    }

    whyInScope = (expr: string, goal?: Goal): Promise<ChildProcess> => {
        if (goal) {
            return this.sendCommand('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
        } else {
            return this.sendCommand('None', `Cmd_why_in_scope_toplevel \"${expr}\"`);
        }
    }


    inferType = (normalization: Normalization, goal?: Goal): (expr: string) => Promise<ChildProcess> => {
        return (expr) => {
            if (goal) {
                return this.sendCommand('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
            } else {
                return this.sendCommand('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
            }
        }
    }

    moduleContents = (normalization: Normalization, expr: string): (goal?: Goal) => Promise<ChildProcess> => {
        return (goal) => {
            if (goal) {
                return this.sendCommand('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
            } else {
                return this.sendCommand('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
            }
        }
    }

    computeNormalForm = (computeMode: ComputeMode, goal?: Goal): (expr: string) => Promise<ChildProcess> => {
        if (semver.gte(this.agdaVersion.sem, '2.6.0')) {  // after 2.6
            return (expr) => {
                if (goal) {
                    return this.sendCommand('NonInteractive', `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`);
                } else {
                    return this.sendCommand('None', `Cmd_compute_toplevel ${computeMode} \"${expr}\"`);
                }
            }
        } else { // prior to 2.6
            const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';

            return (expr) => {
                if (goal) {
                    return this.sendCommand('NonInteractive', `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`);
                } else {
                    return this.sendCommand('None', `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`);
                }
            }
        }
    }

    give = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', `Cmd_give ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    refine = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', `Cmd_refine_or_intro False ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    auto = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', `Cmd_auto ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    'case' = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand('NonInteractive', `Cmd_make_case ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    goalType = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`);
        };
    }

    context = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_context ${normalization} ${goal.index} noRange \"\"`);
        };
    }

    goalTypeAndContext = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`);
        };
    }

    goalTypeAndInferredType = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`);
        };
    }

}
