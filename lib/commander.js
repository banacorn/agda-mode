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
        case 0: return "";
        case 1: return "(no normalization)";
        case 2: return "(full normalization)";
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
            console.log(command.type + " start");
            var test = this.dispatchCommand(command);
            if (test) {
                test.then(function (arg) {
                    console.log(command.type + " done");
                })
                    .catch(function (error) { throw error; });
            }
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
            case 9: return this.nextGoal();
            case 10: return this.previousGoal();
            case 11: return this.whyInScope();
            case 12:
                return this.inferType(command.normalization);
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
    return Commander;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Commander;
