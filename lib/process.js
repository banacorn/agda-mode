"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var child_process_1 = require("child_process");
var parser_1 = require("./parser");
var rectifier_1 = require("./parser/stream/rectifier");
var handler_1 = require("./handler");
var error_1 = require("./error");
var semver = require("semver");
Promise.longStackTraces();
var Process = (function () {
    function Process(core) {
        this.core = core;
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
    Process.prototype.validateExecutablePath = function (path) {
        var _this = this;
        if (path === void 0) { path = ""; }
        return new Promise(function (resolve, reject) {
            path = parser_1.parseFilepath(path);
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
                agdaProcess.stdout.once("data", function (data) {
                    reject(new error_1.ProcExecError(data.toString()));
                });
            }
            catch (error) {
                if (path === "") {
                    reject(new error_1.InvalidExecutablePathError("Path must not be empty: " + path));
                }
                else {
                    reject(new error_1.InvalidExecutablePathError(error + ": " + path));
                }
            }
        });
    };
    Process.prototype.queryExecutablePathUntilSuccess = function (error) {
        var _this = this;
        switch (error.name) {
            case "ProcExecError":
                this.core.panel.setContent("Process execution error", error.message.split("\n"), "error");
                break;
            case "InvalidExecutablePathError":
                this.core.panel.setContent(error.message, [], "warning", "path of executable here");
                break;
            default:
                throw "unknown error: " + error.name;
        }
        this.core.panel.query(false)
            .then(function (path) {
            path = parser_1.parseFilepath(path);
            _this.validateExecutablePath(path)
                .then(function (path) { return path; })
                .catch(error_1.InvalidExecutablePathError, function (error) { _this.queryExecutablePathUntilSuccess(error); });
        })
            .then(function (path) {
            path = parser_1.parseFilepath(path);
            _this.validateExecutablePath(path)
                .then(function (path) { return path; })
                .catch(error_1.InvalidExecutablePathError, function (error) { _this.queryExecutablePathUntilSuccess(error); });
        })
            .then(function (path) {
            atom.config.set("agda-mode.executablePath", path);
            return path;
        })
            .catch(error_1.InvalidExecutablePathError, function (error) { _this.queryExecutablePathUntilSuccess(error); });
    };
    Process.prototype.getExecutablePath = function () {
        var _this = this;
        return this.getPathFromSettings()
            .catch(function (error) { return _this.getPathByWhich(); })
            .catch(function (error) { return _this.queryExecutablePathUntilSuccess(error); });
    };
    Process.prototype.getPathFromSettings = function () {
        var path = atom.config.get("agda-mode.executablePath");
        return this.validateExecutablePath(path);
    };
    Process.prototype.getPathByWhich = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var programName = atom.config.get("agda-mode.programName");
            child_process_1.exec("which " + programName, function (error, stdout, stderr) {
                if (error)
                    reject(new error_1.InvalidExecutablePathError(error.name));
                else
                    resolve(_this.validateExecutablePath(stdout));
            });
        });
    };
    Process.prototype.wireAgdaProcess = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.agdaProcessWired) {
                resolve(_this.agdaProcess);
            }
            else {
                _this.getExecutablePath()
                    .then(function (path) {
                    var args = _this.getProgramArgs();
                    args.push("--interaction");
                    var agdaProcess = child_process_1.spawn(path, args);
                    agdaProcess.on("error", function (error) {
                        reject(error);
                    });
                    agdaProcess.stdout.once("data", function () {
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
            }
        })
            .catch(function (error) {
            throw (new error_1.InvalidExecutablePathError("Failed miserably, please report this issue."));
        });
    };
    Process.prototype.buildRange = function (goal) {
        var start = goal.range.start;
        var startIndex = this.core.editor.toIndex(start);
        var end = goal.range.end;
        var endIndex = this.core.editor.toIndex(end);
        if (semver.gte(this.agdaVersion.sem, "2.5.1")) {
            return "(intervalsToRange (Just (mkAbsolute \"" + this.core.getPath() + "\")) [Interval\n                (Pn\n                    ()\n                    " + (startIndex + 3) + "\n                    " + (start.row + 1) + "\n                    " + (start.column + 3) + ")\n                (Pn\n                    ()\n                    " + (endIndex - 1) + "\n                    " + (end.row + 1) + "\n                    " + (end.column - 1) + ")])";
        }
        else {
            return "\n                (Range [Interval\n                    (Pn\n                        (Just (mkAbsolute \"" + this.core.getPath() + "\"))\n                        " + (startIndex + 3) + "\n                        " + (start.row + 1) + "\n                        " + (start.column + 3) + ")\n                    (Pn\n                        (Just (mkAbsolute \"" + this.core.getPath() + "\"))\n                        " + (endIndex - 1) + "\n                        " + (end.row + 1) + "\n                        " + (end.column - 1) + ")])";
        }
    };
    Process.prototype.sendCommand = function (highlightingLevel, interaction) {
        var _this = this;
        return this.wireAgdaProcess().then(function (agdaProcess) {
            var filepath = _this.core.getPath();
            var highlightingMethod = atom.config.get("agda-mode.highlightingMethod");
            var command;
            if (typeof interaction === "string") {
                command = "IOTCM \"" + filepath + "\" " + highlightingLevel + " " + highlightingMethod + " ( " + interaction + " )\n";
            }
            else {
                command = "IOTCM \"" + filepath + "\" " + highlightingLevel + " " + highlightingMethod + " ( " + interaction() + " )\n";
            }
            agdaProcess.stdin.write(command);
            return agdaProcess;
        });
    };
    Process.prototype.load = function () {
        var _this = this;
        this.core.textBuffer.saveBuffer();
        return this.sendCommand("NonInteractive", function () {
            if (semver.gte(_this.agdaVersion.sem, "2.5.0"))
                return "Cmd_load \"" + _this.core.getPath() + "\" []";
            else
                return "Cmd_load \"" + _this.core.getPath() + "\" [" + _this.getLibraryPath() + "]";
        });
    };
    Process.prototype.quit = function () {
        this.agdaProcess.kill();
        this.agdaProcessWired = false;
        return Promise.resolve();
    };
    Process.prototype.info = function () {
        var path = atom.config.get("agda-mode.executablePath");
        var args = this.getProgramArgs();
        args.unshift("--interaction");
        this.core.panel.setContent("Info", [
            ("Agda version: " + this.agdaVersion.raw),
            ("Agda executable path: " + path),
            ("Agda executable arguments: " + args.join(" "))
        ]);
        return Promise.resolve();
    };
    Process.prototype.compile = function () {
        var _this = this;
        var backend = atom.config.get("agda-mode.backend");
        return this.sendCommand("NonInteractive", function () {
            if (semver.gte(_this.agdaVersion.sem, "2.5.0"))
                return "Cmd_compile " + backend + " \"" + _this.core.getPath() + "\" []";
            else
                return "Cmd_compile " + backend + " \"" + _this.core.getPath() + "\" [" + _this.getLibraryPath() + "]";
        });
    };
    Process.prototype.toggleDisplayOfImplicitArguments = function () {
        return this.sendCommand("NonInteractive", "ToggleImplicitArgs");
    };
    Process.prototype.solveConstraints = function () {
        return this.sendCommand("NonInteractive", "Cmd_solveAll");
    };
    Process.prototype.showConstraints = function () {
        return this.sendCommand("NonInteractive", "Cmd_constraints");
    };
    Process.prototype.showGoals = function () {
        return this.sendCommand("NonInteractive", "Cmd_metas");
    };
    Process.prototype.whyInScope = function (expr, goal) {
        if (goal) {
            return this.sendCommand("NonInteractive", "Cmd_why_in_scope " + goal.index + " noRange \"" + expr + "\"");
        }
        else {
            return this.sendCommand("None", "Cmd_why_in_scope_toplevel \"" + expr + "\"");
        }
    };
    Process.prototype.inferType = function (normalization, expr, goal) {
        if (goal) {
            return this.sendCommand("NonInteractive", "Cmd_infer " + normalization + " " + goal.index + " noRange \"" + expr + "\"");
        }
        else {
            return this.sendCommand("None", "Cmd_infer_toplevel " + normalization + " \"" + expr + "\"");
        }
    };
    Process.prototype.moduleContents = function (normalization, expr, goal) {
        if (goal) {
            return this.sendCommand("NonInteractive", "Cmd_show_module_contents " + normalization + " " + goal.index + " noRange \"" + expr + "\"");
        }
        else {
            return this.sendCommand("None", "Cmd_show_module_contents_toplevel " + normalization + " \"" + expr + "\"");
        }
    };
    Process.prototype.computeNormalForm = function (expr, goal) {
        if (goal) {
            return this.sendCommand("NonInteractive", "Cmd_compute False " + goal.index + " noRange \"" + expr + "\"");
        }
        else {
            return this.sendCommand("None", "Cmd_compute_toplevel False \"" + expr + "\"");
        }
    };
    Process.prototype.computeNormalFormIgnoreAbstract = function (expr, goal) {
        if (goal) {
            return this.sendCommand("NonInteractive", "Cmd_compute True " + goal.index + " noRange \"" + expr + "\"");
        }
        else {
            return this.sendCommand("None", "Cmd_compute_toplevel True \"" + expr + "\"");
        }
    };
    Process.prototype.give = function (goal) {
        return this.sendCommand("NonInteractive", "Cmd_give " + goal.index + " " + this.buildRange(goal) + " \"" + goal.getContent() + "\"");
    };
    Process.prototype.refine = function (goal) {
        return this.sendCommand("NonInteractive", "Cmd_refine_or_intro False " + goal.index + " " + this.buildRange(goal) + " \"" + goal.getContent() + "\"");
    };
    Process.prototype.auto = function (goal) {
        return this.sendCommand("NonInteractive", "Cmd_auto " + goal.index + " " + this.buildRange(goal) + " \"" + goal.getContent() + "\"");
    };
    Process.prototype.case = function (goal) {
        return this.sendCommand("NonInteractive", "Cmd_make_case " + goal.index + " " + this.buildRange(goal) + " \"" + goal.getContent() + "\"");
    };
    Process.prototype.goalType = function (normalization, goal) {
        return this.sendCommand("NonInteractive", "Cmd_goal_type " + normalization + " " + goal.index + " noRange \"\"");
    };
    Process.prototype.context = function (normalization, goal) {
        return this.sendCommand("NonInteractive", "Cmd_context " + normalization + " " + goal.index + " noRange \"\"");
    };
    Process.prototype.goalTypeAndContext = function (normalization, goal) {
        return this.sendCommand("NonInteractive", "Cmd_goal_type_context " + normalization + " " + goal.index + " noRange \"\"");
    };
    Process.prototype.goalTypeAndInferredType = function (normalization, goal) {
        return this.sendCommand("NonInteractive", "Cmd_goal_type_context_infer " + normalization + " " + goal.index + " noRange \"" + goal.getContent() + "\"");
    };
    return Process;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Process;
