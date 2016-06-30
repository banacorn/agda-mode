"use strict";
var Promise = require("bluebird");
var _ = require("lodash");
var error_1 = require("./error");
function resolveCommand(commandType) {
    return function () {
        return Promise.resolve({ type: commandType });
    };
}
function toCamalCase(str) {
    return str.split("-")
        .map(function (str, i) {
        if (i === 0)
            return str;
        else
            return str.charAt(0).toUpperCase() + str.slice(1);
    })
        .join("");
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
        var exception = [0 /* Load */, 5 /* Info */, 24 /* InputSymbol */];
        if (this.loaded || _.includes(exception, command.type)) {
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
        switch (command.type) {
            case 0 /* Load */: return this.load();
            case 1 /* Quit */: return this.quit();
            case 2 /* Restart */: return this.restart();
            case 3 /* Compile */: return this.compile();
            case 4 /* ToggleDisplayOfImplicitArguments */:
                return this.toggleDisplayOfImplicitArguments();
            case 5 /* Info */: return this.info();
            case 7 /* SolveConstraints */:
                return this.solveConstraints();
            case 6 /* ShowConstraints */:
                return this.showConstraints();
            case 8 /* ShowGoals */:
                return this.showGoals();
            case 9 /* NextGoal */: return this.nextGoal();
            case 10 /* PreviousGoal */: return this.previousGoal();
            case 11 /* WhyInScope */: return this.whyInScope();
            case 12 /* InferType */:
                return this.inferType(command.normalization);
            case 13 /* ModuleContents */:
                return this.moduleContents(command.normalization);
            case 14 /* ComputeNormalForm */:
                return this.computeNormalForm();
            case 15 /* ComputeNormalFormIgnoreAbstract */:
                return this.computeNormalFormIgnoreAbstract();
            case 16 /* Give */: return this.give();
            case 17 /* Refine */: return this.refine();
            case 18 /* Auto */: return this.auto();
            case 19 /* Case */: return this.case();
            case 20 /* GoalType */:
                return this.goalType(command.normalization);
            case 21 /* Context */:
                return this.context(command.normalization);
            case 22 /* GoalTypeAndContext */:
                return this.goalTypeAndContext(command.normalization);
            case 23 /* GoalTypeAndInferredType */:
                return this.goalTypeAndInferredType(command.normalization);
            case 24 /* InputSymbol */: return this.inputSymbol();
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
            .then(resolveCommand(0 /* Load */));
    };
    Commander.prototype.quit = function () {
        if (this.loaded) {
            this.loaded = false;
            this.core.atomPanel.hide();
            this.core.textBuffer.removeGoals();
            return this.core.process.quit()
                .then(resolveCommand(1 /* Quit */));
        }
    };
    Commander.prototype.restart = function () {
        this.quit();
        return this.load();
    };
    Commander.prototype.compile = function () {
        return this.core.process.compile()
            .then(resolveCommand(3 /* Compile */));
    };
    Commander.prototype.toggleDisplayOfImplicitArguments = function () {
        return this.core.process.toggleDisplayOfImplicitArguments()
            .then(resolveCommand(4 /* ToggleDisplayOfImplicitArguments */));
    };
    Commander.prototype.info = function () {
        return this.core.process.info()
            .then(resolveCommand(5 /* Info */));
    };
    Commander.prototype.solveConstraints = function () {
        return this.core.process.solveConstraints()
            .then(resolveCommand(7 /* SolveConstraints */));
    };
    Commander.prototype.showConstraints = function () {
        return this.core.process.showConstraints()
            .then(resolveCommand(6 /* ShowConstraints */));
    };
    Commander.prototype.showGoals = function () {
        return this.core.process.showGoals()
            .then(resolveCommand(8 /* ShowGoals */));
    };
    Commander.prototype.nextGoal = function () {
        return this.core.textBuffer.nextGoal()
            .then(resolveCommand(9 /* NextGoal */));
    };
    Commander.prototype.previousGoal = function () {
        return this.core.textBuffer.previousGoal()
            .then(resolveCommand(10 /* PreviousGoal */));
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
            .then(resolveCommand(11 /* WhyInScope */));
    };
    Commander.prototype.inferType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            // goal-specific
            if (goal.isEmpty()) {
                return _this.core.view.query("Infer type " + toDescription(normalization), [], 4 /* Value */, "expression to infer:")
                    .then(_this.core.process.inferType(normalization, goal))
                    .then(resolveCommand(12 /* InferType */));
            }
            else {
                return _this.core.process.inferType(normalization, goal)(goal.getContent())
                    .then(resolveCommand(12 /* InferType */));
            }
        })
            .catch(function () {
            // global command
            return _this.core.view.query("Infer type " + toDescription(normalization), [], 4 /* Value */, "expression to infer:")
                .then(_this.core.process.inferType(normalization))
                .then(resolveCommand(12 /* InferType */));
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
            .then(resolveCommand(13 /* ModuleContents */));
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
            .then(resolveCommand(14 /* ComputeNormalForm */));
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
            .then(resolveCommand(15 /* ComputeNormalFormIgnoreAbstract */));
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
            _this.core.view.set("Error", ["\"Give\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(16 /* Give */));
    };
    Commander.prototype.refine = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Refine\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(17 /* Refine */));
    };
    Commander.prototype.auto = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Auto\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(18 /* Auto */));
    };
    Commander.prototype.case = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.view.query("Case", [], 0 /* PlainText */, "expression to case:")
                    .then(goal.setContent);
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.case)
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Case\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(19 /* Case */));
    };
    Commander.prototype.goalType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Goal Type\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(20 /* GoalType */));
    };
    Commander.prototype.context = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Context\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(21 /* Context */));
    };
    Commander.prototype.goalTypeAndContext = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Goal Type & Context\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(22 /* GoalTypeAndContext */));
    };
    Commander.prototype.goalTypeAndInferredType = function (normalization) {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .catch(error_1.OutOfGoalError, function () {
            _this.core.view.set("Error", ["\"Goal Type & Inferred Type\" is a goal-specific command, please place the cursor in a goal"], 1 /* Error */);
        })
            .then(resolveCommand(23 /* GoalTypeAndInferredType */));
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
        return Promise.resolve({ type: 24 /* InputSymbol */ });
    };
    return Commander;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Commander;
