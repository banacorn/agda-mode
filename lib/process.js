"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var child_process_1 = require("child_process");
var parser_1 = require("./parser");
var rectifier_1 = require("./parser/stream/rectifier");
var handler_1 = require("./handler");
var error_1 = require("./error");
var semver = require("semver");
Promise.longStackTraces(); // for debugging
var Process = (function () {
    function Process(core) {
        var _this = this;
        this.core = core;
        // locate the path and see if it is truly a Agda process
        this.validateExecutablePath = function (path) {
            return new Promise(function (resolve, reject) {
                path = parser_1.parseFilepath(path) || "";
                if (path === "") {
                    reject(new error_1.InvalidExecutablePathError("Path must not be empty: " + path));
                }
                else {
                    try {
                        var args = _this.getProgramArgs();
                        args.push("-V");
                        var agdaProcess = child_process_1.spawn(path, args);
                        agdaProcess.on("error", function (error) {
                            reject(new error_1.InvalidExecutablePathError("unable to spawn Agda process: " + path));
                        });
                        agdaProcess.stdout.once("data", function (data) {
                            var result = data.toString().match(/^Agda version (.*)\n$/);
                            if (result) {
                                // normalize version number to valid semver
                                var rawVerNum = result[1];
                                var semVerNum = _.take((result[1] + ".0.0.0").split("."), 3).join(".");
                                _this.agdaVersion = {
                                    raw: rawVerNum,
                                    sem: semVerNum
                                };
                                atom.config.set("agda-mode.executablePath", path);
                                resolve(path);
                            }
                            else {
                                reject(new error_1.InvalidExecutablePathError("Spawned process is not Agda: " + path));
                            }
                        });
                    }
                    catch (error) {
                        reject(new error_1.InvalidExecutablePathError(error + ": " + path));
                    }
                }
            });
        };
        this.sendCommand = function (highlightingLevel, interaction) {
            var filepath = _this.core.getPath();
            var highlightingMethod = atom.config.get("agda-mode.highlightingMethod");
            var command;
            if (typeof interaction === "string") {
                command = "IOTCM \"" + filepath + "\" " + highlightingLevel + " " + highlightingMethod + " ( " + interaction + " )\n";
            }
            else {
                command = "IOTCM \"" + filepath + "\" " + highlightingLevel + " " + highlightingMethod + " ( " + interaction() + " )\n";
            }
            _this.agdaProcess.stdin.write(command);
            return Promise.resolve(_this.agdaProcess);
        };
        this.load = function () {
            return _this.wireAgdaProcess().then(function (agdaProcess) {
                _this.agdaProcess = agdaProcess;
                _this.agdaProcessWired = true;
                // force save before load, since we are sending filepath but content
                _this.core.textBuffer.saveBuffer();
                // if version > 2.5, ignore library path configuration
                return _this.sendCommand("NonInteractive", function () {
                    if (semver.gte(_this.agdaVersion.sem, "2.5.0"))
                        return "Cmd_load \"" + _this.core.getPath() + "\" []";
                    else
                        return "Cmd_load \"" + _this.core.getPath() + "\" [" + _this.getLibraryPath() + "]";
                });
            }).catch(error_1.ProcExecError, function (error) {
                _this.queryExecutablePathUntilSuccess(error);
            });
        };
        this.quit = function () {
            _this.agdaProcess.kill();
            _this.agdaProcessWired = false;
            return Promise.resolve();
        };
        this.info = function () {
            var path = atom.config.get("agda-mode.executablePath");
            var args = _this.getProgramArgs();
            args.unshift("--interaction");
            _this.core.view.set("Info", [
                ("Agda version: " + _this.agdaVersion.raw),
                ("Agda executable path: " + path),
                ("Agda executable arguments: " + args.join(" "))
            ]);
            return Promise.resolve();
        };
        this.compile = function () {
            var backend = atom.config.get("agda-mode.backend");
            return _this.sendCommand("NonInteractive", function () {
                if (semver.gte(_this.agdaVersion.sem, "2.5.0"))
                    return "Cmd_compile " + backend + " \"" + _this.core.getPath() + "\" []";
                else
                    return "Cmd_compile " + backend + " \"" + _this.core.getPath() + "\" [" + _this.getLibraryPath() + "]";
            });
        };
        this.toggleDisplayOfImplicitArguments = function () {
            return _this.sendCommand("NonInteractive", "ToggleImplicitArgs");
        };
        this.solveConstraints = function () {
            return _this.sendCommand("NonInteractive", "Cmd_solveAll");
        };
        this.showConstraints = function () {
            return _this.sendCommand("NonInteractive", "Cmd_constraints");
        };
        this.showGoals = function () {
            return _this.sendCommand("NonInteractive", "Cmd_metas");
        };
        this.whyInScope = function (expr, goal) {
            if (goal) {
                return _this.sendCommand("NonInteractive", "Cmd_why_in_scope " + goal.index + " noRange \"" + expr + "\"");
            }
            else {
                return _this.sendCommand("None", "Cmd_why_in_scope_toplevel \"" + expr + "\"");
            }
        };
        this.inferType = function (normalization, goal) {
            return function (expr) {
                if (goal) {
                    return _this.sendCommand("NonInteractive", "Cmd_infer " + normalization + " " + goal.index + " noRange \"" + expr + "\"");
                }
                else {
                    return _this.sendCommand("None", "Cmd_infer_toplevel " + normalization + " \"" + expr + "\"");
                }
            };
        };
        this.moduleContents = function (normalization, expr) {
            return function (goal) {
                if (goal) {
                    return _this.sendCommand("NonInteractive", "Cmd_show_module_contents " + normalization + " " + goal.index + " noRange \"" + expr + "\"");
                }
                else {
                    return _this.sendCommand("None", "Cmd_show_module_contents_toplevel " + normalization + " \"" + expr + "\"");
                }
            };
        };
        this.computeNormalForm = function (goal) {
            return function (expr) {
                if (goal) {
                    return _this.sendCommand("NonInteractive", "Cmd_compute False " + goal.index + " noRange \"" + expr + "\"");
                }
                else {
                    return _this.sendCommand("None", "Cmd_compute_toplevel False \"" + expr + "\"");
                }
            };
        };
        this.computeNormalFormIgnoreAbstract = function (goal) {
            return function (expr) {
                if (goal) {
                    return _this.sendCommand("NonInteractive", "Cmd_compute True " + goal.index + " noRange \"" + expr + "\"");
                }
                else {
                    return _this.sendCommand("None", "Cmd_compute_toplevel True \"" + expr + "\"");
                }
            };
        };
        this.give = function (goal) {
            return _this.sendCommand("NonInteractive", "Cmd_give " + goal.index + " " + _this.buildRange(goal) + " \"" + goal.getContent() + "\"");
        };
        this.refine = function (goal) {
            return _this.sendCommand("NonInteractive", "Cmd_refine_or_intro False " + goal.index + " " + _this.buildRange(goal) + " \"" + goal.getContent() + "\"");
        };
        this.auto = function (goal) {
            return _this.sendCommand("NonInteractive", "Cmd_auto " + goal.index + " " + _this.buildRange(goal) + " \"" + goal.getContent() + "\"");
        };
        this["case"] = function (goal) {
            return _this.sendCommand("NonInteractive", "Cmd_make_case " + goal.index + " " + _this.buildRange(goal) + " \"" + goal.getContent() + "\"");
        };
        this.goalType = function (normalization) {
            return function (goal) {
                return _this.sendCommand("NonInteractive", "Cmd_goal_type " + normalization + " " + goal.index + " noRange \"\"");
            };
        };
        this.context = function (normalization) {
            return function (goal) {
                return _this.sendCommand("NonInteractive", "Cmd_context " + normalization + " " + goal.index + " noRange \"\"");
            };
        };
        this.goalTypeAndContext = function (normalization) {
            return function (goal) {
                return _this.sendCommand("NonInteractive", "Cmd_goal_type_context " + normalization + " " + goal.index + " noRange \"\"");
            };
        };
        this.goalTypeAndInferredType = function (normalization) {
            return function (goal) {
                return _this.sendCommand("NonInteractive", "Cmd_goal_type_context_infer " + normalization + " " + goal.index + " noRange \"" + goal.getContent() + "\"");
            };
        };
    }
    Process.prototype.getLibraryPath = function () {
        var path = atom.config.get("agda-mode.libraryPath");
        path.unshift(".");
        return path.map(function (p) { return "\"" + parser_1.parseFilepath(p) + "\""; }).join(", ");
    };
    Process.prototype.getProgramArgs = function () {
        var args = atom.config.get("agda-mode.programArgs");
        return _.compact(args.split(" "));
    };
    // keep banging the user until we got the right path
    Process.prototype.queryExecutablePathUntilSuccess = function (error) {
        var _this = this;
        var header;
        var type;
        var placeholder;
        if (error instanceof error_1.AutoExecPathSearchError) {
            header = "Automatic executable path searching failed (when searching for the name \"" + error.programName + "\")";
            type = 2 /* Warning */;
            placeholder = "please enter the path by manual";
        }
        else if (error instanceof error_1.ProcExecError) {
            header = "Process execution error: " + error.message;
            type = 2 /* Warning */;
            placeholder = "please enter the path by manual";
        }
        else {
            header = "Invalid executable path";
            type = 2 /* Warning */;
            placeholder = "path of executable here";
        }
        return this.core.view.query(header, type, placeholder, false) // disable input method
            .then(this.validateExecutablePath)
            .then(function (path) {
            atom.config.set("agda-mode.executablePath", path);
            return path;
        })
            .catch(error_1.InvalidExecutablePathError, function (error) { return _this.queryExecutablePathUntilSuccess(error); });
    };
    // 1. get executable path from the settings
    // 2. else by the command "which"
    // 3. else query the user until success
    Process.prototype.getExecutablePath = function () {
        var _this = this;
        return this.getPathFromSettings() //  1
            .catch(error_1.InvalidExecutablePathError, function () { return _this.autoGetPath(); }) //  2
            .catch(function (error) { return _this.queryExecutablePathUntilSuccess(error); }); //  3
    };
    // get executable path from settings and validate it
    Process.prototype.getPathFromSettings = function () {
        var path = atom.config.get("agda-mode.executablePath");
        return this.validateExecutablePath(path);
    };
    // get executable path by the command "which"
    Process.prototype.autoGetPath = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var onWindows = process.platform === "win32";
            var programName = atom.config.get("agda-mode.programName");
            if (onWindows) {
                reject(new error_1.AutoExecPathSearchError("", programName));
            }
            else {
                child_process_1.exec("which " + programName, function (error, stdout, stderr) {
                    if (error)
                        reject(new error_1.AutoExecPathSearchError(error.name, programName));
                    else
                        resolve(_this.validateExecutablePath(stdout));
                });
            }
        });
    };
    Process.prototype.wireAgdaProcess = function () {
        var _this = this;
        if (this.agdaProcessWired) {
            return Promise.resolve(this.agdaProcess);
        }
        else {
            return this.getExecutablePath()
                .then(function (path) {
                return new Promise(function (resolve, reject) {
                    // Agda program arguments
                    var args = _this.getProgramArgs();
                    args.push("--interaction");
                    var agdaProcess = child_process_1.spawn(path, args);
                    // catch other forms of errors
                    agdaProcess.on("error", function (error) {
                        reject(new error_1.ProcExecError(error.message));
                    });
                    agdaProcess.on("close", function (signal) {
                        reject(new error_1.ProcExecError("exit with signal " + signal.toString()));
                    });
                    agdaProcess.stdout.once("data", function (data) {
                        _this.agdaProcessWired = true;
                        _this.agdaProcess = agdaProcess;
                        resolve(agdaProcess);
                    });
                    agdaProcess.stdout
                        .pipe(new rectifier_1.default)
                        .on("data", function (data) {
                        var response = parser_1.parseAgdaResponse(data);
                        handler_1.handleAgdaResponse(_this.core, response);
                    });
                });
            });
        }
    };
    // COMMANDS
    // data IOTCM = IOTCM FilePath HighlightingLevel HighlightingMethod (Interaction" range)
    // data HighlightingLevel = None | NonInteractive | Interactive
    // data HighlightingMethod = Direct | Indirect
    //
    // data Range a = Range [Interval" a]
    // data Interval a = Interval { iStart, iEnd :: !(Position" a) }
    // data Position a = Pn a !Int32 !Int32 !Int32
    Process.prototype.buildRange = function (goal) {
        var start = goal.range.start;
        var startIndex = this.core.editor.toIndex(start);
        var end = goal.range.end;
        var endIndex = this.core.editor.toIndex(end);
        if (semver.gte(this.agdaVersion.sem, "2.5.1")) {
            return "(intervalsToRange (Just (mkAbsolute \"" + this.core.getPath() + "\")) [Interval (Pn () " + (startIndex + 3) + " " + (start.row + 1) + " " + (start.column + 3) + ") (Pn () " + (endIndex - 1) + " " + (end.row + 1) + " " + (end.column - 1) + ")])";
        }
        else {
            return "(Range [Interval (Pn (Just (mkAbsolute \"" + this.core.getPath() + "\")) " + (startIndex + 3) + " " + (start.row + 1) + " " + (start.column + 3) + ") (Pn (Just (mkAbsolute \"" + this.core.getPath() + "\")) " + (endIndex - 1) + " " + (end.row + 1) + " " + (end.column - 1) + ")])";
        }
    };
    return Process;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Process;
