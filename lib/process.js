"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
const parser_1 = require("./parser");
const rectifier_1 = require("./parser/stream/rectifier");
const handler_1 = require("./handler");
const error_1 = require("./error");
const Action = require("./view/actions");
var semver = require('semver');
Promise.longStackTraces(); // for debugging
class Process {
    constructor(core) {
        this.core = core;
        // locate the path and see if it is truly a Agda process
        this.validateExecutablePath = (path) => {
            return new Promise((resolve, reject) => {
                path = parser_1.parseFilepath(path) || '';
                if (path === '') {
                    reject(new error_1.InvalidExecutablePathError(`Path must not be empty`, path));
                }
                else {
                    try {
                        const args = this.getProgramArgs();
                        args.push('-V');
                        const agdaProcess = child_process_1.spawn(path, args);
                        agdaProcess.on('error', (error) => {
                            reject(new error_1.InvalidExecutablePathError(`unable to spawn Agda process`, path));
                        });
                        agdaProcess.stderr.once('data', (data) => {
                            let message = `Spawned process returned with the following result (from stderr):\n\"${data.toString()}\"`;
                            reject(new error_1.InvalidExecutablePathError(message, path));
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
                            }
                            else {
                                let message = `Spawned process returned with the following result (from stdout):\n\"${data.toString()}\"`;
                                reject(new error_1.InvalidExecutablePathError(message, path));
                            }
                        });
                    }
                    catch (error) {
                        reject(new error_1.InvalidExecutablePathError(error.toString(), path));
                    }
                }
            });
        };
        this.sendCommand = (highlightingLevel, interaction) => {
            const filepath = this.core.getPath();
            const highlightingMethod = atom.config.get('agda-mode.highlightingMethod');
            let command;
            if (typeof interaction === 'string') {
                command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`;
            }
            else {
                command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction()} )\n`;
            }
            if (atom.inDevMode()) {
                this.core.view.store.dispatch(Action.devAddRequest(command));
            }
            this.agdaProcess.stdin.write(command);
            return Promise.resolve(this.agdaProcess);
        };
        this.load = () => {
            return this.wireAgdaProcess().then((agdaProcess) => {
                this.agdaProcess = agdaProcess;
                this.agdaProcessWired = true;
                // force save before load, since we are sending filepath but content
                this.core.textBuffer.saveBuffer();
                // if version > 2.5, ignore library path configuration
                return this.sendCommand('NonInteractive', () => {
                    if (semver.gte(this.agdaVersion.sem, '2.5.0'))
                        return `Cmd_load \"${this.core.getPath()}\" []`;
                    else
                        return `Cmd_load \"${this.core.getPath()}\" [${this.getLibraryPath()}]`;
                });
            }).catch(error_1.ProcExecError, (error) => {
                this.queryExecutablePathUntilSuccess(error);
            }).catch(error_1.AgdaParseError, (error) => {
                const args = this.getProgramArgs();
                args.push('-V');
                this.core.view.set('Agda Parse Error', [
                    `Arguments passed to Agda: \"${args.join(' ')}\"`,
                    `Message from agda:`
                ].concat(error.message), 3 /* Error */);
            });
        };
        this.quit = () => {
            this.agdaProcess.kill();
            this.agdaProcessWired = false;
            return Promise.resolve();
        };
        this.info = () => {
            const path = atom.config.get('agda-mode.executablePath');
            const args = this.getProgramArgs();
            args.push('--interaction');
            const agdaVersion = this.agdaVersion ? this.agdaVersion.raw : 'unknown';
            this.core.view.set('Info', [
                `Agda version: ${agdaVersion}`,
                `Agda executable path: ${path}`,
                `Agda executable arguments: ${args.join(' ')}`
            ], 0 /* PlainText */);
            return Promise.resolve();
        };
        this.compile = () => {
            const backend = atom.config.get('agda-mode.backend');
            return this.sendCommand('NonInteractive', () => {
                if (semver.gte(this.agdaVersion.sem, '2.5.0'))
                    return `Cmd_compile ${backend} \"${this.core.getPath()}\" []`;
                else
                    return `Cmd_compile ${backend} \"${this.core.getPath()}\" [${this.getLibraryPath()}]`;
            });
        };
        this.toggleDisplayOfImplicitArguments = () => {
            return this.sendCommand('NonInteractive', 'ToggleImplicitArgs');
        };
        this.solveConstraints = () => {
            return this.sendCommand('NonInteractive', 'Cmd_solveAll');
        };
        this.showConstraints = () => {
            return this.sendCommand('NonInteractive', 'Cmd_constraints');
        };
        this.showGoals = () => {
            return this.sendCommand('NonInteractive', 'Cmd_metas');
        };
        this.whyInScope = (expr, goal) => {
            if (goal) {
                return this.sendCommand('NonInteractive', `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
            }
            else {
                return this.sendCommand('None', `Cmd_why_in_scope_toplevel \"${expr}\"`);
            }
        };
        this.inferType = (normalization, goal) => {
            return (expr) => {
                if (goal) {
                    return this.sendCommand('NonInteractive', `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
                }
                else {
                    return this.sendCommand('None', `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
                }
            };
        };
        this.moduleContents = (normalization, expr) => {
            return (goal) => {
                if (goal) {
                    return this.sendCommand('NonInteractive', `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
                }
                else {
                    return this.sendCommand('None', `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
                }
            };
        };
        this.computeNormalForm = (computeMode, goal) => {
            if (semver.gte(this.agdaVersion.sem, '2.5.2')) {
                return (expr) => {
                    if (goal) {
                        return this.sendCommand('NonInteractive', `Cmd_compute ${computeMode} ${goal.index} noRange \"${expr}\"`);
                    }
                    else {
                        return this.sendCommand('None', `Cmd_compute_toplevel ${computeMode} \"${expr}\"`);
                    }
                };
            }
            else {
                const ignoreAbstract = computeMode === 'DefaultCompute' ? 'False' : 'True';
                return (expr) => {
                    if (goal) {
                        return this.sendCommand('NonInteractive', `Cmd_compute ${ignoreAbstract} ${goal.index} noRange \"${expr}\"`);
                    }
                    else {
                        return this.sendCommand('None', `Cmd_compute_toplevel ${ignoreAbstract} \"${expr}\"`);
                    }
                };
            }
        };
        this.give = (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_give ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
        };
        this.refine = (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_refine_or_intro False ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
        };
        this.auto = (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_auto ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
        };
        this['case'] = (goal) => {
            return this.sendCommand('NonInteractive', `Cmd_make_case ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
        };
        this.goalType = (normalization) => {
            return (goal) => {
                return this.sendCommand('NonInteractive', `Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`);
            };
        };
        this.context = (normalization) => {
            return (goal) => {
                return this.sendCommand('NonInteractive', `Cmd_context ${normalization} ${goal.index} noRange \"\"`);
            };
        };
        this.goalTypeAndContext = (normalization) => {
            return (goal) => {
                return this.sendCommand('NonInteractive', `Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`);
            };
        };
        this.goalTypeAndInferredType = (normalization) => {
            return (goal) => {
                return this.sendCommand('NonInteractive', `Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`);
            };
        };
    }
    getLibraryPath() {
        const path = atom.config.get('agda-mode.libraryPath');
        path.unshift('.');
        return path.map((p) => { return `\"${parser_1.parseFilepath(p)}\"`; }).join(', ');
    }
    getProgramArgs() {
        const args = atom.config.get('agda-mode.programArgs');
        return _.compact(args.split(' '));
    }
    // keep banging the user until we got the right path
    queryExecutablePathUntilSuccess(error) {
        let name;
        let message;
        let type;
        let placeholder;
        if (error instanceof error_1.AutoExecPathSearchError) {
            name = `Automatic executable path searching failed`;
            message = [
                `searching for: \"${error.programName}\" in the environment`
            ].concat(_.compact(error.message.split('\n')));
            type = 4 /* Warning */;
            placeholder = 'please enter the path by manual or change the settings again';
        }
        else if (error instanceof error_1.InvalidExecutablePathError) {
            name = `Invalid executable path`;
            message = [`Path: ${error.path}`].concat(error.message.split('\n'));
            type = 3 /* Error */;
            placeholder = 'try another path';
        }
        else if (error instanceof error_1.ProcExecError) {
            name = `Process execution error`;
            message = error.message.split('\n');
            type = 4 /* Warning */;
            placeholder = 'please enter the path by manual or change the settings again';
        }
        return this.core.view.query(name, message, type, placeholder, false) // disable input method in the mini editor
            .then(this.validateExecutablePath)
            .then((path) => {
            atom.config.set('agda-mode.executablePath', path);
            return path;
        })
            .catch(error_1.InvalidExecutablePathError, (error) => { return this.queryExecutablePathUntilSuccess(error); });
    }
    // if auto path searching is on,
    // then:
    //  1. get executable path from the settings
    //  2. else by the command 'which'
    //  3. else query the user until success
    // else:
    //  1. get executable path from the settings
    //  2. else query the user until success
    getExecutablePath() {
        if (atom.config.get('agda-mode.autoSearchPath')) {
            return this.getPathFromSettings() //  1
                .catch(error_1.InvalidExecutablePathError, () => { return this.autoGetPath(); }) //  2
                .catch((error) => { return this.queryExecutablePathUntilSuccess(error); }); //  3
        }
        else {
            return this.getPathFromSettings() //  1
                .catch((error) => { return this.queryExecutablePathUntilSuccess(error); }); //  2
        }
    }
    // get executable path from settings and validate it
    getPathFromSettings() {
        const path = atom.config.get('agda-mode.executablePath');
        return this.validateExecutablePath(path);
    }
    // get executable path by the command 'F'
    autoGetPath() {
        return new Promise((resolve, reject) => {
            const onWindows = process.platform === 'win32';
            const programName = atom.config.get('agda-mode.programName');
            if (onWindows) {
                reject(new error_1.AutoExecPathSearchError('', programName));
            }
            else {
                child_process_1.exec(`which ${programName}`, (error, stdout, stderr) => {
                    if (error) {
                        // console.error(error);
                        reject(new error_1.AutoExecPathSearchError(error.toString(), programName));
                    }
                    else {
                        resolve(this.validateExecutablePath(stdout));
                    }
                });
            }
        });
    }
    wireAgdaProcess() {
        if (this.agdaProcessWired) {
            return Promise.resolve(this.agdaProcess);
        }
        else {
            return this.getExecutablePath()
                .then((path) => {
                return new Promise((resolve, reject) => {
                    // Agda program arguments
                    const args = this.getProgramArgs();
                    args.push('--interaction');
                    const agdaProcess = child_process_1.spawn(path, args);
                    // catch other forms of errors
                    agdaProcess.on('error', (error) => {
                        reject(new error_1.ProcExecError(error.message));
                    });
                    agdaProcess.on('close', (signal) => {
                        reject(new error_1.ProcExecError(`exit with signal ${signal}`));
                    });
                    agdaProcess.stdout.once('data', (data) => {
                        const result = data.toString().match(/^A/);
                        if (result) {
                            this.agdaProcessWired = true;
                            this.agdaProcess = agdaProcess;
                            resolve(agdaProcess);
                        }
                        else {
                            reject(new error_1.AgdaParseError(data.toString()));
                        }
                    });
                    agdaProcess.stdout
                        .pipe(new rectifier_1.default)
                        .on('data', (data) => {
                        try {
                            if (atom.inDevMode()) {
                                this.core.view.store.dispatch(Action.devAddResponse(data));
                            }
                            const response = parser_1.parseAgdaResponse(data);
                            handler_1.handleAgdaResponse(this.core, response);
                        }
                        catch (error) {
                            console.log(error);
                            // show some message
                            this.core.view.set('Agda Parse Error', [`Message from agda:`].concat(data.toString()), 3 /* Error */);
                        }
                    });
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
    buildRange(goal) {
        const start = goal.range.start;
        const startIndex = this.core.editor.toIndex(start);
        const end = goal.range.end;
        const endIndex = this.core.editor.toIndex(end);
        if (semver.gte(this.agdaVersion.sem, '2.5.1')) {
            return `(intervalsToRange (Just (mkAbsolute \"${this.core.getPath()}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
        }
        else {
            return `(Range [Interval (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`;
        }
    }
}
exports.default = Process;
//# sourceMappingURL=process.js.map