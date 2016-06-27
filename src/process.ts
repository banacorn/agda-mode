import * as Promise from "bluebird";
import * as _ from "lodash";
import { spawn, exec, ChildProcess } from "child_process";
import { parseFilepath, parseAgdaResponse } from "./parser";
import Rectifier from "./parser/stream/rectifier";
import { handleAgdaResponse } from "./handler";
import { InvalidExecutablePathError, ProcExecError } from "./error";
import { Goal, Normalization, View } from "./types";
import Core from "./core";

var semver = require("semver");
declare var atom: any;

Promise.longStackTraces();  // for debugging

export default class Process {

    agdaProcessWired: boolean
    agdaProcess: ChildProcess
    agdaVersion: {
        raw: string,
        sem: string
    }

    constructor(private core: Core) {}

    getLibraryPath(): string {
        const path = atom.config.get("agda-mode.libraryPath");
        path.unshift(".");
        return path.map((p) => { return `\"${ parseFilepath(p) }\"`; }).join(", ");
    }

    getProgramArgs(): string[] {
        const args: string = atom.config.get("agda-mode.programArgs");
        return _.compact(args.split(" "));
    }

    // locate the path and see if it is truly a Agda process
    validateExecutablePath(path = ""): Promise<string> {
        return new Promise((resolve: (string) => void, reject) => {
            path = parseFilepath(path);
            try {
                const args = this.getProgramArgs()
                args.push("-V");
                const agdaProcess = spawn(path, args);
                agdaProcess.on("error", (error) => {
                    reject(new InvalidExecutablePathError(`unable to spawn Agda process: ${path}`));
                })
                agdaProcess.stdout.once("data", (data) => {
                    const result = data.toString().match(/^Agda version (.*)\n$/);
                    if (result) {
                        // normalize version number to valid semver
                        const rawVerNum = result[1];
                        const semVerNum = _.take((result[1] + ".0.0.0").split("."), 3).join(".");
                        this.agdaVersion = {
                            raw: rawVerNum,
                            sem: semVerNum
                        };
                        atom.config.set("agda-mode.executablePath", path);
                        resolve(path);
                    } else {
                        reject(new InvalidExecutablePathError(`Spawned process is not Agda: ${path}`));
                    }
                });
                agdaProcess.stdout.once("data", (data) => {
                    reject(new ProcExecError(data.toString()));
                });
            } catch (error) {
                if (path === "") {
                    reject(new InvalidExecutablePathError(`Path must not be empty: ${path}`));
                } else {
                    reject(new InvalidExecutablePathError(`${error}: ${path}`));
                }
            }
        });
    }

    // keep banging the user until we got the right path
    queryExecutablePathUntilSuccess(error: Error) {
        switch (error.name) {
            case "ProcExecError":
                this.core.view.setContent("Process execution error", error.message.split("\n"), View.Type.Error);
                break;
            case "InvalidExecutablePathError":
                this.core.view.setContent(error.message, [], View.Type.Warning, "path of executable here");
                break;
            default:
                throw `unknown error: ${error.name}`;
        }
        this.core.view.query(false)    // disable input method
            .then((path) => {
                path = parseFilepath(path);
                return this.validateExecutablePath(path)
                    .then((path) => { return path; })
                    .catch(InvalidExecutablePathError, (error) => { this.queryExecutablePathUntilSuccess(error) });
            })
            .then((path) => {
                path = parseFilepath(path);
                return this.validateExecutablePath(path)
                    .then((path) => { return path; })
                    .catch(InvalidExecutablePathError, (error) => { this.queryExecutablePathUntilSuccess(error) });
            })
            .then((path) => {
                atom.config.set("agda-mode.executablePath", path)
                return path;
            })
            .catch(InvalidExecutablePathError, (error) => { this.queryExecutablePathUntilSuccess(error) });
    }

    // 1. get executable path from the settings
    // 2. else by the command "which"
    // 3. else query the user until success
    getExecutablePath(): Promise<string> {
        return this.getPathFromSettings()                                                      //  1
            .catch((error) => { return this.getPathByWhich(); })                        //  2
            .catch((error) => { return this.queryExecutablePathUntilSuccess(error); })  //  3
    }

    // get executable path from settings and validate it
    getPathFromSettings(): Promise<string> {
        const path = atom.config.get("agda-mode.executablePath");
        return this.validateExecutablePath(path);
    }

    // get executable path by the command "which"
    getPathByWhich(): Promise<string> {
        return new Promise((resolve: (string) => void, reject) => {
            const programName = atom.config.get("agda-mode.programName");
            exec(`which ${programName}`, (error, stdout, stderr) => {
                if (error)
                    reject(new InvalidExecutablePathError(error.name));
                else
                resolve(this.validateExecutablePath(stdout));
            });
        });
    }

    wireAgdaProcess(): Promise<ChildProcess> {
        return new Promise((resolve: (string) => void, reject) => {
            if (this.agdaProcessWired) {
                resolve(this.agdaProcess);
            } else {
                this.getExecutablePath()
                    .then((path) => {
                        // Agda program arguments
                        const args = this.getProgramArgs();
                        args.push("--interaction");
                        const agdaProcess = spawn(path, args);

                        // catch other forms of errors
                        agdaProcess.on("error", (error) => {
                            reject(error);
                        });

                        agdaProcess.stdout.once("data", () => {
                            this.agdaProcessWired = true;
                            this.agdaProcess = agdaProcess;
                            resolve(agdaProcess);
                        });

                        agdaProcess.stdout
                            .pipe(new Rectifier)
                            .on("data", (data) => {
                                const response = parseAgdaResponse(data);
                                handleAgdaResponse(this.core, response);
                            });

                    })
            }
        })
        .catch((error) => {
            throw (new InvalidExecutablePathError("Failed miserably, please report this issue."));
        });

    }

    // COMMANDS

    // data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction" range)
    // data HighlightingLevel = None | NonInteractive | Interactive
    // data HighlightingMethod = Direct | Indirect
    //
    // data Range a = Range [Interval" a]
    // data Interval a = Interval { iStart, iEnd :: !(Position" a) }
    // data Position a = Pn a !Int32 !Int32 !Int32


    buildRange(goal: Goal): string {
        const start       = goal.range.start;
        const startIndex  = this.core.editor.toIndex(start);
        const end         = goal.range.end;
        const endIndex    = this.core.editor.toIndex(end);
        if (semver.gte(this.agdaVersion.sem, "2.5.1")) {
            return `(intervalsToRange (Just (mkAbsolute \"${this.core.getPath()}\")) [Interval (Pn () ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn () ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
        } else {
            return `(Range [Interval (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${startIndex + 3} ${start.row + 1} ${start.column + 3}) (Pn (Just (mkAbsolute \"${this.core.getPath()}\")) ${endIndex - 1} ${end.row + 1} ${end.column - 1})])`
        }
    }


    private sendCommand = (highlightingLevel: string, interaction: string | (() => string)): Promise<ChildProcess> => {
        return this.wireAgdaProcess().then((agdaProcess) => {
            const filepath = this.core.getPath();
            const highlightingMethod = atom.config.get("agda-mode.highlightingMethod");
            let command: string;
            if (typeof interaction === "string") {
                command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction} )\n`
            } else {    // interaction is a callback
                command = `IOTCM \"${filepath}\" ${highlightingLevel} ${highlightingMethod} ( ${interaction()} )\n`;
            }
            agdaProcess.stdin.write(command);
            return agdaProcess;
        });
    }

    load = (): Promise<ChildProcess> => {
        // force save before load, since we are sending filepath but content
        this.core.textBuffer.saveBuffer();
        // if version > 2.5, ignore library path configuration
        return this.sendCommand("NonInteractive", () => {
            if (semver.gte(this.agdaVersion.sem, "2.5.0"))
                return `Cmd_load \"${this.core.getPath()}\" []`
            else
                return `Cmd_load \"${this.core.getPath()}\" [${this.getLibraryPath()}]`
        });
    }

    quit = (): Promise<void> => {
        this.agdaProcess.kill();
        this.agdaProcessWired = false;
        return Promise.resolve();
    }

    info = (): Promise<void> => {
        const path = atom.config.get("agda-mode.executablePath");
        const args = this.getProgramArgs();
        args.unshift("--interaction");

        this.core.view.setContent("Info", [
            `Agda version: ${this.agdaVersion.raw}`,
            `Agda executable path: ${path}`,
            `Agda executable arguments: ${args.join(" ")}`
        ]);

        return Promise.resolve();
    }

    compile = (): Promise<ChildProcess> => {
        const backend = atom.config.get("agda-mode.backend");
        return this.sendCommand("NonInteractive", () => {
            if (semver.gte(this.agdaVersion.sem, "2.5.0"))
                return `Cmd_compile ${backend} \"${this.core.getPath()}\" []`
            else
                return `Cmd_compile ${backend} \"${this.core.getPath()}\" [${this.getLibraryPath()}]`
        })
    }

    toggleDisplayOfImplicitArguments = (): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", "ToggleImplicitArgs");
    }

    solveConstraints = (): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", "Cmd_solveAll");
    }

    showConstraints = (): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", "Cmd_constraints");
    }

    showGoals = (): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", "Cmd_metas");
    }

    whyInScope = (expr: string, goal?: Goal): Promise<ChildProcess> => {
        if (goal) {
            return this.sendCommand("NonInteractive", `Cmd_why_in_scope ${goal.index} noRange \"${expr}\"`);
        } else {
            return this.sendCommand("None", `Cmd_why_in_scope_toplevel \"${expr}\"`);
        }
    }


    inferType = (normalization: Normalization, goal?: Goal): (expr: string) => Promise<ChildProcess> => {
        return (expr) => {
            if (goal) {
                return this.sendCommand("NonInteractive", `Cmd_infer ${normalization} ${goal.index} noRange \"${expr}\"`);
            } else {
                return this.sendCommand("None", `Cmd_infer_toplevel ${normalization} \"${expr}\"`);
            }
        }
    }

    moduleContents = (normalization: Normalization, expr: string): (goal?: Goal) => Promise<ChildProcess> => {
        return (goal) => {
            if (goal) {
                return this.sendCommand("NonInteractive", `Cmd_show_module_contents ${normalization} ${goal.index} noRange \"${expr}\"`);
            } else {
                return this.sendCommand("None", `Cmd_show_module_contents_toplevel ${normalization} \"${expr}\"`);
            }
        }
    }

    computeNormalForm = (expr: string): (goal?: Goal) => Promise<ChildProcess> => {
        return (goal) => {
            if (goal) {
                return this.sendCommand("NonInteractive", `Cmd_compute False ${goal.index} noRange \"${expr}\"`);
            } else {
                return this.sendCommand("None", `Cmd_compute_toplevel False \"${expr}\"`);
            }
        }
    }

    computeNormalFormIgnoreAbstract = (expr: string): (goal?: Goal) => Promise<ChildProcess> => {
        return (goal) => {
            if (goal) {
                return this.sendCommand("NonInteractive", `Cmd_compute True ${goal.index} noRange \"${expr}\"`);
            } else {
                return this.sendCommand("None", `Cmd_compute_toplevel True \"${expr}\"`);
            }
        }
    }

    give = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", `Cmd_give ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    refine = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", `Cmd_refine_or_intro False ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    auto = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", `Cmd_auto ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    "case" = (goal: Goal): Promise<ChildProcess> => {
        return this.sendCommand("NonInteractive", `Cmd_make_case ${goal.index} ${this.buildRange(goal)} \"${goal.getContent()}\"`);
    }

    goalType = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand("NonInteractive", `Cmd_goal_type ${normalization} ${goal.index} noRange \"\"`);
        };
    }

    context = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand("NonInteractive", `Cmd_context ${normalization} ${goal.index} noRange \"\"`);
        };
    }

    goalTypeAndContext = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand("NonInteractive", `Cmd_goal_type_context ${normalization} ${goal.index} noRange \"\"`);
        };
    }

    goalTypeAndInferredType = (normalization: Normalization): (Goal) => Promise<ChildProcess> => {
        return (goal) => {
            return this.sendCommand("NonInteractive", `Cmd_goal_type_context_infer ${normalization} ${goal.index} noRange \"${goal.getContent()}\"`);
        };
    }

}
