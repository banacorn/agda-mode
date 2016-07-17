"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var error_1 = require("./error");
function resolveCommand(commandKind) {
    return function () {
        return Promise.resolve({
            status: "Issued",
            command: commandKind
        });
    };
}
function toDescription(normalization) {
    switch (normalization) {
        case "Simplified": return "";
        case "Instantiated": return "(no normalization)";
        case "Normalised": return "(full normalization)";
        default: throw "unknown normalization: " + normalization;
    }
}
var Commander = (function () {
    function Commander(core) {
        this.core = core;
    }
    Commander.prototype.activate = function (command) {
        var _this = this;
        // some commands can only be executed after "loaded"
        var exception = ["Load", "Quit", "Info", "InputSymbol"];
        if (this.loaded || _.includes(exception, command.kind)) {
            this.dispatchCommand(command)
                .catch(error_1.QueryCancelledError, function () {
                _this.core.view.set("Query cancelled", [], 2 /* Warning */);
            })
                .catch(function (error) {
                console.error(command);
                throw error;
            });
        }
    };
    Commander.prototype.dispatchCommand = function (command) {
        switch (command.kind) {
            case "Load": return this.load();
            case "Quit": return this.quit();
            case "Restart": return this.restart();
            case "Compile": return this.compile();
            case "ToggleDisplayOfImplicitArguments":
                return this.toggleDisplayOfImplicitArguments();
            case "Info": return this.info();
            case "SolveConstraints":
                return this.solveConstraints();
            case "ShowConstraints":
                return this.showConstraints();
            case "ShowGoals":
                return this.showGoals();
            case "NextGoal": return this.nextGoal();
            case "PreviousGoal": return this.previousGoal();
            case "WhyInScope": return this.whyInScope();
            case "InferType":
                return this.inferType(command.normalization);
            case "ModuleContents":
                return this.moduleContents(command.normalization);
            case "ComputeNormalForm":
                return this.computeNormalForm();
            case "ComputeNormalFormIgnoreAbstract":
                return this.computeNormalFormIgnoreAbstract();
            case "Give": return this.give();
            case "Refine": return this.refine();
            case "Auto": return this.auto();
            case "Case": return this.case();
            case "GoalType":
                return this.goalType(command.normalization);
            case "Context":
                return this.context(command.normalization);
            case "GoalTypeAndContext":
                return this.goalTypeAndContext(command.normalization);
            case "GoalTypeAndInferredType":
                return this.goalTypeAndInferredType(command.normalization);
            case "InputSymbol": return this.inputSymbol();
            default: throw "undispatched command type " + command;
        }
    };
    //
    //  Commands
    //
    Commander.prototype.load = function () {
        var _this = this;
        this.core.atomPanel.show();
        return this.core.process.load()
            .then(function () {
            _this.loaded = true;
        })
            .then(resolveCommand("Load"));
    };
    Commander.prototype.quit = function () {
        this.core.atomPanel.hide();
        if (this.loaded) {
            this.loaded = false;
            this.core.textBuffer.removeGoals();
            return this.core.process.quit()
                .then(resolveCommand("Quit"));
        }
        else {
            return Promise.resolve({ status: "Issued", command: "Quit" });
        }
    };
    Commander.prototype.restart = function () {
        this.quit();
        return this.load();
    };
    Commander.prototype.compile = function () {
        return this.core.process.compile()
            .then(resolveCommand("Compile"));
    };
    Commander.prototype.toggleDisplayOfImplicitArguments = function () {
        return this.core.process.toggleDisplayOfImplicitArguments()
            .then(resolveCommand("ToggleDisplayOfImplicitArguments"));
    };
    Commander.prototype.info = function () {
        return this.core.process.info()
            .then(resolveCommand("Info"));
    };
    Commander.prototype.solveConstraints = function () {
        return this.core.process.solveConstraints()
            .then(resolveCommand("SolveConstraints"));
    };
    Commander.prototype.showConstraints = function () {
        return this.core.process.showConstraints()
            .then(resolveCommand("ShowConstraints"));
    };
    Commander.prototype.showGoals = function () {
        return this.core.process.showGoals()
            .then(resolveCommand("ShowGoals"));
    };
    Commander.prototype.nextGoal = function () {
        return this.core.textBuffer.nextGoal()
            .then(resolveCommand("NextGoal"));
    };
    Commander.prototype.previousGoal = function () {
        return this.core.textBuffer.previousGoal()
            .then(resolveCommand("PreviousGoal"));
    };
    //
    //  The following commands may have a goal-specific version
    //
    Commander.prototype.whyInScope = function () {
        var _this = this;
        return this.core.view.query("Scope info", [], 0 /* PlainText */, "name:")
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .then(function (goal) {
                // goal-specific
                return _this.core.process.whyInScope(expr, goal);
            })
                .catch(error_1.OutOfGoalError, function () {
                // global command
                return _this.core.process.whyInScope(expr);
            });
        })
            .then(resolveCommand("WhyInScope"));
    };
    Commander.prototype.inferType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            // goal-specific
            if (goal.isEmpty()) {
                return _this.core.view.query("Infer type " + toDescription(normalization), [], 4 /* Value */, "expression to infer:")
                    .then(_this.core.process.inferType(normalization, goal))
                    .then(resolveCommand("InferType"));
            }
            else {
                return _this.core.process.inferType(normalization, goal)(goal.getContent())
                    .then(resolveCommand("InferType"));
            }
        })
            .catch(function () {
            // global command
            return _this.core.view.query("Infer type " + toDescription(normalization), [], 4 /* Value */, "expression to infer:")
                .then(_this.core.process.inferType(normalization))
                .then(resolveCommand("InferType"));
        });
    };
    Commander.prototype.moduleContents = function (normalization) {
        var _this = this;
        return this.core.view.query("Module contents " + toDescription(normalization), [], 0 /* PlainText */, "module name:")
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .then(_this.core.process.moduleContents(normalization, expr))
                .catch(function (error) {
                return _this.core.process.moduleContents(normalization, expr)();
            });
        })
            .then(resolveCommand("ModuleContents"));
    };
    Commander.prototype.computeNormalForm = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query("Compute normal form", [], 4 /* Value */, "expression to normalize:")
                    .then(_this.core.process.computeNormalForm(goal));
            }
            else {
                return _this.core.process.computeNormalForm(goal)(goal.getContent());
            }
        })
            .catch(error_1.OutOfGoalError, function () {
            return _this.core.view.query("Compute normal form", [], 4 /* Value */, "expression to normalize:")
                .then(_this.core.process.computeNormalForm());
        })
            .then(resolveCommand("ComputeNormalForm"));
    };
    Commander.prototype.computeNormalFormIgnoreAbstract = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query("Compute normal form (ignoring abstract)", [], 4 /* Value */, "expression to normalize:")
                    .then(_this.core.process.computeNormalFormIgnoreAbstract(goal));
            }
            else {
                return _this.core.process.computeNormalFormIgnoreAbstract(goal)(goal.getContent());
            }
        })
            .catch(error_1.OutOfGoalError, function () {
            return _this.core.view.query("Compute normal form (ignoring abstract)", [], 4 /* Value */, "expression to normalize:")
                .then(_this.core.process.computeNormalFormIgnoreAbstract());
        })
            .then(resolveCommand("ComputeNormalFormIgnoreAbstract"));
    };
    //
    //  The following commands only working in the context of a specific goal
    //
    Commander.prototype.give = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query("Give", [], 0 /* PlainText */, "expression to give:")
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.give)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Give\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("Give"));
    };
    Commander.prototype.refine = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Refine\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("Refine"));
    };
    Commander.prototype.auto = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Auto\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("Auto"));
    };
    Commander.prototype.case = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query("Case", [], 0 /* PlainText */, "the argument to case:")
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.case)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Case\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("Case"));
    };
    Commander.prototype.goalType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Goal Type\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("GoalType"));
    };
    Commander.prototype.context = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Context\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("Context"));
    };
    Commander.prototype.goalTypeAndContext = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Goal Type & Context\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("GoalTypeAndContext"));
    };
    Commander.prototype.goalTypeAndInferredType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Out of goal", ["\"Goal Type & Inferred Type\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand("GoalTypeAndInferredType"));
    };
    Commander.prototype.inputSymbol = function () {
        if (atom.config.get("agda-mode.inputMethod")) {
            if (!this.loaded) {
                this.core.atomPanel.show();
                this.core.view.set("Not loaded", [], 2 /* Warning */);
            }
            this.core.inputMethod.activate();
        }
        else {
            this.core.editor.insertText("\\");
        }
        return Promise.resolve({ status: "Issued", command: "InputSymbol" });
    };
    return Commander;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Commander;
