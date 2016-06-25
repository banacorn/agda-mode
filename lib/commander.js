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
        var exception = [0, 24];
        if (this.loaded || _.includes(exception, command.type)) {
            var test = this.dispatchCommand(command);
            test.catch(function (error) { throw error; });
        }
    };
    Commander.prototype.dispatchCommand = function (command) {
        switch (command.type) {
            case 0: return this.load();
            case 1: return this.quit();
            case 2: return this.restart();
            case 3: return this.compile();
            case 4:
                return this.toggleDisplayOfImplicitArguments();
            case 5: return this.info();
            case 7:
                return this.solveConstraints();
            case 6:
                return this.showConstraints();
            case 8:
                return this.showGoals();
            case 9: return this.nextGoal();
            case 10: return this.previousGoal();
            case 11: return this.whyInScope();
            case 12:
                return this.inferType(command.normalization);
            case 13:
                return this.moduleContents(command.normalization);
            case 14:
                return this.computeNormalForm();
            case 15:
                return this.computeNormalFormIgnoreAbstract();
            case 16: return this.give();
            case 17: return this.refine();
            case 18: return this.auto();
            case 19: return this.case();
            case 20:
                return this.goalType(command.normalization);
            case 21:
                return this.context(command.normalization);
            case 22:
                return this.goalTypeAndContext(command.normalization);
            case 23:
                return this.goalTypeAndInferredType(command.normalization);
            case 24: return this.inputSymbol();
            default: throw "undispatched command type " + command;
        }
    };
    Commander.prototype.load = function () {
        var _this = this;
        this.core.atomPanel.show();
        return this.core.process.load()
            .then(function () {
            _this.loaded = true;
        })
            .then(resolveCommand(0));
    };
    Commander.prototype.quit = function () {
        if (this.loaded) {
            this.loaded = false;
            this.core.atomPanel.hide();
            this.core.textBuffer.removeGoals();
            return this.core.process.quit()
                .then(resolveCommand(1));
        }
        else {
            return Promise.reject(new error_1.NotLoadedError("the file is not loaded"));
        }
    };
    Commander.prototype.restart = function () {
        this.quit();
        return this.load();
    };
    Commander.prototype.compile = function () {
        return this.core.process.compile()
            .then(resolveCommand(3));
    };
    Commander.prototype.toggleDisplayOfImplicitArguments = function () {
        return this.core.process.toggleDisplayOfImplicitArguments()
            .then(resolveCommand(4));
    };
    Commander.prototype.info = function () {
        return this.core.process.info()
            .then(resolveCommand(5));
    };
    Commander.prototype.solveConstraints = function () {
        return this.core.process.solveConstraints()
            .then(resolveCommand(7));
    };
    Commander.prototype.showConstraints = function () {
        return this.core.process.showConstraints()
            .then(resolveCommand(6));
    };
    Commander.prototype.showGoals = function () {
        return this.core.process.showGoals()
            .then(resolveCommand(8));
    };
    Commander.prototype.nextGoal = function () {
        return this.core.textBuffer.nextGoal()
            .then(resolveCommand(9));
    };
    Commander.prototype.previousGoal = function () {
        return this.core.textBuffer.previousGoal()
            .then(resolveCommand(10));
    };
    Commander.prototype.whyInScope = function () {
        var _this = this;
        this.core.panel.setContent("Scope info", [], "plain-text", "name:");
        this.core.panel.queryMode = true;
        return this.core.panel.query()
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .done(function (goal) {
                _this.core.textBuffer.focus();
                return _this.core.process.whyInScope(expr, goal);
            }, function () {
                _this.core.textBuffer.focus();
                return _this.core.process.whyInScope(expr);
            });
        });
    };
    Commander.prototype.inferType = function (normalization) {
        var _this = this;
        this.core.panel.setContent("Infer type " + toDescription(normalization), [], "value", "expression to infer:");
        this.core.panel.queryMode = true;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                return _this.core.panel.query()
                    .then(function (expr) {
                    _this.core.process.inferType(normalization, expr, goal);
                });
            }
            else {
                return _this.core.process.inferType(normalization, goal.getContent(), goal);
            }
        })
            .catch(function () {
            return _this.core.panel.query()
                .then(function (expr) {
                return _this.core.process.inferType(normalization, expr);
            });
        });
    };
    Commander.prototype.moduleContents = function (normalization) {
        var _this = this;
        this.core.panel.setContent("Module contents " + toDescription(normalization), [], "plain-text", "module name:");
        return this.core.panel.query()
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .done(function (goal) {
                _this.core.textBuffer.focus();
                return _this.core.process.moduleContents(normalization, expr, goal);
            }, function () {
                _this.core.textBuffer.focus();
                return _this.core.process.moduleContents(normalization, expr);
            });
        });
    };
    Commander.prototype.computeNormalForm = function () {
        var _this = this;
        this.core.panel.setContent("Compute normal form", [], "value", "expression to normalize:");
        return this.core.panel.query()
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .done(function (goal) {
                _this.core.textBuffer.focus();
                return _this.core.process.computeNormalForm(expr, goal);
            }, function () {
                _this.core.textBuffer.focus();
                return _this.core.process.computeNormalForm(expr);
            });
        });
    };
    Commander.prototype.computeNormalFormIgnoreAbstract = function () {
        var _this = this;
        this.core.panel.setContent("Compute normal form (ignoring abstract)", [], "value", "expression to normalize:");
        return this.core.panel.query()
            .then(function (expr) {
            return _this.core.textBuffer.getCurrentGoal()
                .done(function (goal) {
                _this.core.textBuffer.focus();
                return _this.core.process.computeNormalFormIgnoreAbstract(expr, goal);
            }, function () {
                _this.core.textBuffer.focus();
                return _this.core.process.computeNormalFormIgnoreAbstract(expr);
            });
        });
    };
    Commander.prototype.give = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                _this.core.panel.setContent("Give", [], "plain-text", "expression to give:");
                _this.core.panel.query()
                    .then(function (expr) {
                    goal.setContent(expr);
                    return goal;
                });
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.give)
            .then(resolveCommand(16));
    };
    Commander.prototype.refine = function () {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.refine)
            .then(resolveCommand(17));
    };
    Commander.prototype.auto = function () {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.auto)
            .then(resolveCommand(18));
    };
    Commander.prototype.case = function () {
        var _this = this;
        return this.core.textBuffer.getCurrentGoal()
            .then(function (goal) {
            if (goal.isEmpty()) {
                _this.core.panel.setContent("Case", [], "plain-text", "expression to case:");
                _this.core.panel.query()
                    .then(function (expr) {
                    goal.setContent(expr);
                    return goal;
                });
            }
            else {
                return goal;
            }
        })
            .then(this.core.process.case)
            .then(resolveCommand(19));
    };
    Commander.prototype.goalType = function (normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalType(normalization))
            .then(resolveCommand(20));
    };
    Commander.prototype.context = function (normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.context(normalization))
            .then(resolveCommand(21));
    };
    Commander.prototype.goalTypeAndContext = function (normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndContext(normalization))
            .then(resolveCommand(22));
    };
    Commander.prototype.goalTypeAndInferredType = function (normalization) {
        return this.core.textBuffer.getCurrentGoal()
            .then(this.core.process.goalTypeAndInferredType(normalization))
            .then(resolveCommand(23));
    };
    Commander.prototype.inputSymbol = function () {
        if (atom.config.get("agda-mode.inputMethod")) {
            if (!this.loaded) {
                this.core.atomPanel.show();
                this.core.panel.setContent("Not loaded", [], "warning");
            }
            this.core.inputMethod.activate();
        }
        else {
            this.core.editor.insertText("\\");
        }
        return Promise.resolve({ type: 24 });
    };
    return Commander;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Commander;
