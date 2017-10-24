"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Promise = require("bluebird");
const _ = require("lodash");
const parser_1 = require("./parser");
const error_1 = require("./error");
const goal_1 = require("./editor/goal");
var { Range, Point, CompositeDisposable } = require('atom');
class Editor {
    constructor(core, textEditor) {
        this.core = core;
        this.textEditor = textEditor;
        this.goal = new GoalManager(textEditor);
        this.highlighting = new HighlightManager(this);
    }
    getTextEditor() {
        return this.textEditor;
    }
    warnOutOfGoal() {
        this.core.view.set('Out of goal', ['For this command, please place the cursor in a goal'], 4 /* Warning */);
    }
    warnEmptyGoal(error) {
        this.core.view.set('No content', [error.message], 4 /* Warning */);
    }
    //////////////////
    //  Filesystem  //
    //////////////////
    // issue #48, TextBuffer::save will be async in Atom 1.19
    save() {
        let promise = this.textEditor.save();
        if (promise && promise.then) {
            return promise.then((e) => {
                return Promise.resolve();
            });
        }
        else {
            return Promise.resolve();
        }
    }
    getPath() {
        return parser_1.parseFilepath(this.textEditor.getPath());
    }
    ///////////////////////
    //  Index <=> Point  //
    ///////////////////////
    fromIndex(ind) {
        return this.textEditor.getBuffer().positionForCharacterIndex(ind);
    }
    toIndex(pos) {
        return this.textEditor.getBuffer().characterIndexForPosition(pos);
    }
    translate(pos, n) {
        return this.fromIndex((this.toIndex(pos)) + n);
    }
    fromIndexRange(range) {
        const start = this.fromIndex(range.start);
        const end = this.fromIndex(range.end);
        return new Range(start, end);
    }
    /////////////////////////
    //  Cursor Management  //
    /////////////////////////
    // shift cursor if in certain goal
    protectCursor(callback) {
        let position = this.textEditor.getCursorBufferPosition();
        let result = callback();
        return this.goal.pointing(position)
            .then((goal) => {
            // reposition the cursor in the goal only if it's a fresh hole (coming from '?')
            let isFreshHole = goal.isEmpty();
            if (isFreshHole) {
                let newPosition = this.translate(goal.range.start, 3);
                setTimeout(() => {
                    this.textEditor.setCursorBufferPosition(newPosition);
                });
            }
            else {
                this.textEditor.setCursorBufferPosition(position);
            }
            return result;
        }).catch(error_1.OutOfGoalError, () => {
            this.textEditor.setCursorBufferPosition(position);
            return result;
        });
    }
    focus() {
        let textEditorElement = atom.views.getView(this.textEditor);
        textEditorElement.focus();
    }
    jumpToNextGoal() {
        const cursor = this.textEditor.getCursorBufferPosition();
        let nextGoal = null;
        const positions = this.goal.getAll().map((goal) => {
            const start = goal.range.start;
            return this.translate(start, 3);
        });
        positions.forEach((position) => {
            if (position.isGreaterThan(cursor) && nextGoal === null) {
                nextGoal = position;
            }
        });
        // no goal ahead of cursor, loop back
        if (nextGoal === null)
            nextGoal = _.head(positions);
        // jump only when there are goals
        if (!_.isEmpty(positions))
            this.textEditor.setCursorBufferPosition(nextGoal);
        return Promise.resolve({});
    }
    jumpToPreviousGoal() {
        const cursor = this.textEditor.getCursorBufferPosition();
        let previousGoal = null;
        const positions = this.goal.getAll().map((goal) => {
            const start = goal.range.start;
            return this.translate(start, 3);
        });
        positions.forEach((position) => {
            if (position.isLessThan(cursor)) {
                previousGoal = position;
            }
        });
        // no goal ahead of cursor, loop back
        if (previousGoal === null)
            previousGoal = _.last(positions);
        // jump only when there are goals
        if (!_.isEmpty(positions))
            this.textEditor.setCursorBufferPosition(previousGoal);
        return Promise.resolve({});
    }
    jumpToGoal(index) {
        let goal = this.goal.find(index);
        if (goal) {
            let start = goal.range.start;
            let position = this.translate(start, 3);
            this.textEditor.setCursorBufferPosition(position);
            this.focus();
        }
    }
    jumpToLocation(location) {
        this.focus();
        if (location.path) {
            atom.workspace.open(location.path)
                .then(editor => {
                editor.setSelectedBufferRange(location.range, true);
            });
        }
        else {
            this.goal.pointing()
                .then((goal) => {
                let range;
                if (location.range.start.row === 0) {
                    range = location.range
                        .translate(goal.range.start)
                        .translate([0, 3]); // hole boundary
                }
                else {
                    range = location.range
                        .translate([goal.range.start.row, 0]);
                }
                this.textEditor.setSelectedBufferRange(range, true);
            }).catch(() => this.warnOutOfGoal());
        }
    }
    ////////////////////////
    //  Command Handlers  //
    ////////////////////////
    onInteractionPoints(indices) {
        return this.protectCursor(() => {
            const textRaw = this.textEditor.getText();
            this.goal.removeAll();
            const goals = parser_1.parseHole(textRaw, indices).map((hole) => {
                let range = this.fromIndexRange(hole.originalRange);
                this.textEditor.setTextInBufferRange(range, hole.content);
                return new goal_1.default(this.textEditor, hole.index, {
                    start: hole.modifiedRange.start,
                    end: hole.modifiedRange.end,
                });
            });
            this.goal.setAll(goals);
        });
    }
    onSolveAll(index, content) {
        return this.protectCursor(() => {
            let goal = this.goal.find(index);
            goal.setContent(content);
            return goal;
        });
    }
    // Give_Paren  : ["agda2-give-action", 1, "paren"]
    // Give_NoParen: ["agda2-give-action", 1, "no-paren"]
    // Give_String : ["agda2-give-action", 0, ...]
    onGiveAction(index, giveResult, result) {
        return this.protectCursor(() => {
            let goal = this.goal.find(index);
            switch (giveResult) {
                case 'Paren':
                    result = goal.getContent();
                    goal.setContent(`(${result})`);
                    break;
                case 'NoParen':
                    // do nothing
                    break;
                case 'String':
                    result = result.replace(/\\n/g, '\n');
                    goal.setContent(result);
                    break;
            }
            goal.removeBoundary();
            this.goal.remove(index);
        });
    }
    onMakeCase(variant, result) {
        return this.protectCursor(() => {
            this.goal.pointing().then((goal) => {
                switch (variant) {
                    case 'Function':
                        goal.writeLines(result);
                        break;
                    case 'ExtendedLambda':
                        goal.writeLambda(result);
                        break;
                }
            }).catch(() => this.warnOutOfGoal());
        });
    }
    onJumpToError(filepath, charIndex) {
        if (this.getPath() === filepath) {
            let position = this.fromIndex(charIndex - 1);
            this.textEditor.setCursorBufferPosition(position);
        }
        return Promise.resolve();
    }
    // Agda generates files with syntax highlighting notations,
    // those files are temporary and should be deleted once used.
    // note: no highlighting yet, we'll just delete them.
    onHighlightLoadAndDelete(filepath) {
        fs.unlink(filepath, () => { });
        return Promise.resolve();
    }
}
exports.default = Editor;
class GoalManager {
    constructor(textEditor) {
        this.textEditor = textEditor;
        this.goals = [];
    }
    getAll() {
        return this.goals;
    }
    setAll(goals) {
        this.goals = goals;
    }
    remove(index) {
        this.goals
            .filter((goal) => { return goal.index === index; })
            .forEach((goal) => { goal.destroy(); });
        this.goals = this.goals
            .filter((goal) => { return goal.index !== index; });
    }
    removeAll() {
        this.goals.forEach((goal) => {
            goal.destroy();
        });
        this.goals = [];
    }
    find(index) {
        let goals = this.goals.filter((goal) => { return goal.index === index; });
        return goals[0];
    }
    // the goal where the cursor is positioned
    pointing(cursor = this.textEditor.getCursorBufferPosition()) {
        const goals = this.goals.filter((goal) => {
            return goal.range.containsPoint(cursor, false);
        });
        if (_.isEmpty(goals))
            return Promise.reject(new error_1.OutOfGoalError('out of goal'));
        else
            return Promise.resolve(goals[0]);
    }
    // reject if goal is empty
    guardGoalHasContent(goal) {
        if (goal.getContent()) {
            return Promise.resolve(goal);
        }
        else {
            return Promise.reject(new error_1.EmptyGoalError('goal is empty', goal));
        }
    }
}
class HighlightManager {
    constructor(editor) {
        this.editor = editor;
        this.markers = [];
    }
    add(annotation) {
        const start = this.editor.fromIndex(parseInt(annotation.start) - 1);
        const end = this.editor.fromIndex(parseInt(annotation.end) - 1);
        const range = new Range(start, end);
        const marker = this.editor.getTextEditor().markBufferRange(range);
        this.markers.push(marker);
        const decorator = this.editor.getTextEditor().decorateMarker(marker, {
            type: 'highlight',
            class: `highlight-decoration ${annotation.type}`
        });
    }
    destroyAll() {
        this.markers.forEach((marker) => { marker.destroy(); });
        this.markers = [];
        return Promise.resolve();
    }
}
//# sourceMappingURL=editor.js.map