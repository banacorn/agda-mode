"use strict";
var fs = require("fs");
var Promise = require("bluebird");
var _ = require("lodash");
var types_1 = require("./types");
var parser_1 = require("./parser");
var error_1 = require("./error");
var TextBuffer = (function () {
    function TextBuffer(core) {
        this.core = core;
        this.goals = [];
        this.core = core;
    }
    /////////////////////////
    //  Cursor Management  //
    /////////////////////////
    // shift cursor if in certain goal
    TextBuffer.prototype.protectCursor = function (callback) {
        var _this = this;
        var position = this.core.editor.getCursorBufferPosition();
        var result = callback();
        return this.getCurrentGoal(position)
            .then(function (goal) {
            // reposition the cursor in the goal only if it's a fresh hole (coming from '?')
            var isFreshHole = goal.isEmpty();
            if (isFreshHole) {
                var newPosition_1 = _this.core.editor.translate(goal.range.start, 3);
                setTimeout(function () {
                    _this.core.editor.setCursorBufferPosition(newPosition_1);
                });
            }
            else {
                _this.core.editor.setCursorBufferPosition(position);
            }
            return result;
        }).catch(error_1.OutOfGoalError, function () {
            _this.core.editor.setCursorBufferPosition(position);
            return result;
        });
    };
    TextBuffer.prototype.focus = function () {
        var textEditorElement = atom.views.getView(this.core.editor);
        textEditorElement.focus();
    };
    ///////////////////////
    //  File Management  //
    ///////////////////////
    TextBuffer.prototype.saveBuffer = function () {
        this.core.editor.save();
    };
    ///////////////////////
    //  Goal Management  //
    ///////////////////////
    TextBuffer.prototype.removeGoals = function () {
        this.goals.forEach(function (goal) {
            goal.destroy();
        });
        this.goals = [];
    };
    TextBuffer.prototype.removeGoal = function (index) {
        this.goals
            .filter(function (goal) { return goal.index === index; })
            .forEach(function (goal) { goal.destroy(); });
        this.goals = this.goals
            .filter(function (goal) { return goal.index !== index; });
    };
    TextBuffer.prototype.findGoal = function (index) {
        var goals = this.goals.filter(function (goal) { return goal.index === index; });
        return goals[0];
    };
    TextBuffer.prototype.getCurrentGoal = function (cursor) {
        if (cursor === void 0) { cursor = this.core.editor.getCursorBufferPosition(); }
        var goals = this.goals.filter(function (goal) {
            return goal.range.containsPoint(cursor, false);
        });
        if (_.isEmpty(goals))
            return Promise.reject(new error_1.OutOfGoalError('out of goal'));
        else
            return Promise.resolve(goals[0]);
    };
    TextBuffer.prototype.warnOutOfGoal = function () {
        console.log('beep', this);
        this.core.view.set('Out of goal', ['For this command, please place the cursor in a goal'], 4 /* Warning */);
    };
    TextBuffer.prototype.warnEmptyGoal = function (error) {
        this.core.view.set('No content', [error.message], 4 /* Warning */);
    };
    // reject if goal is empty
    TextBuffer.prototype.guardGoalHasContent = function (goal) {
        if (goal.getContent()) {
            return Promise.resolve(goal);
        }
        else {
            return Promise.reject(new error_1.EmptyGoalError('goal is empty', goal));
        }
    };
    ////////////////
    //  Commands  //
    ////////////////
    TextBuffer.prototype.nextGoal = function () {
        var _this = this;
        var cursor = this.core.editor.getCursorBufferPosition();
        var nextGoal = null;
        var positions = this.goals.map(function (goal) {
            var start = goal.range.start;
            return _this.core.editor.translate(start, 3);
        });
        positions.forEach(function (position) {
            if (position.isGreaterThan(cursor) && nextGoal === null) {
                nextGoal = position;
            }
        });
        // no goal ahead of cursor, loop back
        if (nextGoal === null)
            nextGoal = _.head(positions);
        // jump only when there are goals
        if (!_.isEmpty(positions))
            this.core.editor.setCursorBufferPosition(nextGoal);
        return Promise.resolve({});
    };
    TextBuffer.prototype.previousGoal = function () {
        var _this = this;
        var cursor = this.core.editor.getCursorBufferPosition();
        var previousGoal = null;
        var positions = this.goals.map(function (goal) {
            var start = goal.range.start;
            return _this.core.editor.translate(start, 3);
        });
        positions.forEach(function (position) {
            if (position.isLessThan(cursor)) {
                previousGoal = position;
            }
        });
        // no goal ahead of cursor, loop back
        if (previousGoal === null)
            previousGoal = _.last(positions);
        // jump only when there are goals
        if (!_.isEmpty(positions))
            this.core.editor.setCursorBufferPosition(previousGoal);
        return Promise.resolve({});
    };
    TextBuffer.prototype.jumpToGoal = function (index) {
        var goal = this.goals.filter(function (goal) { return goal.index === index; })[0];
        if (goal) {
            var start = goal.range.start;
            var position = this.core.editor.translate(start, 3);
            this.core.editor.setCursorBufferPosition(position);
            this.focus();
        }
    };
    TextBuffer.prototype.jumpToLocation = function (location) {
        var _this = this;
        this.focus();
        if (location.path) {
            atom.workspace.open(location.path)
                .then(function (editor) {
                editor.setSelectedBufferRange(location.range, true);
            });
        }
        else {
            this.getCurrentGoal()
                .then(function (goal) {
                var range;
                if (location.range.start.row === 0) {
                    range = location.range
                        .translate(goal.range.start)
                        .translate([0, 3]); // hole boundary
                }
                else {
                    range = location.range
                        .translate([goal.range.start.row, 0]);
                }
                _this.core.editor.setSelectedBufferRange(range, true);
            }).catch(function () { return _this.warnOutOfGoal(); });
        }
    };
    ////////////////////////
    //  Command Handlers  //
    ////////////////////////
    TextBuffer.prototype.onGoalsAction = function (indices) {
        var _this = this;
        return this.protectCursor(function () {
            var textRaw = _this.core.editor.getText();
            _this.removeGoals();
            parser_1.parseHole(textRaw, indices).forEach(function (hole) {
                var range = _this.core.editor.fromCIRange(hole.originalRange);
                _this.core.editor.setTextInBufferRange(range, hole.content);
                var goal = new types_1.Goal(_this.core.editor, hole.index, hole.modifiedRange.start, hole.modifiedRange.end);
                _this.goals.push(goal);
            });
        });
    };
    TextBuffer.prototype.onSolveAllAction = function (index, content) {
        var _this = this;
        return this.protectCursor(function () {
            var goal = _this.findGoal(index);
            goal.setContent(content);
            return goal;
        });
    };
    TextBuffer.prototype.onGiveAction = function (index, content, hasParenthesis) {
        var _this = this;
        return this.protectCursor(function () {
            var goal = _this.findGoal(index);
            if (!_.isEmpty(content)) {
                content = content.replace(/\\n/g, '\n');
                goal.setContent(content);
            }
            if (hasParenthesis) {
                content = goal.getContent();
                goal.setContent("(" + content + ")");
            }
            goal.removeBoundary();
            _this.removeGoal(index);
        });
    };
    TextBuffer.prototype.onMakeCaseAction = function (content) {
        var _this = this;
        return this.protectCursor(function () {
            _this.getCurrentGoal().then(function (goal) {
                goal.writeLines(content);
            }).catch(function () { return _this.warnOutOfGoal(); });
        });
    };
    TextBuffer.prototype.onMakeCaseActionExtendLam = function (content) {
        var _this = this;
        return this.protectCursor(function () {
            _this.getCurrentGoal().then(function (goal) {
                goal.writeLambda(content);
            }).catch(function () { return _this.warnOutOfGoal(); });
        });
    };
    TextBuffer.prototype.onGoto = function (filepath, charIndex) {
        if (this.core.getPath() === filepath) {
            var position = this.core.editor.fromIndex(charIndex - 1);
            this.core.editor.setCursorBufferPosition(position);
        }
    };
    // Agda generates files with syntax highlighting notations,
    // those files are temporary and should be deleted once used.
    // note: no highlighting yet, we'll just delete them.
    TextBuffer.prototype.onHighlightLoadAndDelete = function (filepath) {
        fs.unlink(filepath);
    };
    return TextBuffer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TextBuffer;
//# sourceMappingURL=text-buffer.js.map