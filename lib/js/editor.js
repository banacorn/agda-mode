"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Promise = require("bluebird");
const _ = require("lodash");
const parser_1 = require("./parser");
const error_1 = require("./error");
const goal_1 = require("./editor/goal");
const Position_1 = require("./view/component/Panel/Agda/Syntax/Position");
const atom_1 = require("atom");
class RunningInfoManager {
    constructor() {
        this.isOpeningEditor = false;
        this.editor = undefined;
        this.buffer = [];
    }
    add(info) {
        if (this.editor) {
            this.editor.insertText(info);
        }
        else {
            if (this.isOpeningEditor) {
                this.buffer.push(info);
            }
            else {
                this.isOpeningEditor = true;
                atom.workspace.open(undefined, {
                    activateItem: false
                }).then(editor => {
                    this.editor = editor;
                    this.editor.insertText(this.buffer.join(''));
                    this.editor.onDidDestroy(() => {
                        this.destroy();
                    });
                    this.isOpeningEditor = false;
                    this.buffer = [];
                });
            }
        }
    }
    clear() {
        if (this.editor) {
            this.editor.insertText('');
            // TODO: clear the editor (or do nothing)
        }
        else {
            if (this.isOpeningEditor) {
                this.buffer = [];
            }
            else {
                this.isOpeningEditor = true;
                atom.workspace.open(undefined, {
                    activateItem: false
                }).then(editor => {
                    this.editor = editor;
                    this.editor.insertText('');
                    this.editor.onDidDestroy(() => {
                        this.destroy();
                    });
                    this.isOpeningEditor = false;
                    this.buffer = [];
                });
            }
        }
    }
    destroy() {
        this.buffer = [];
        this.editor = undefined;
        this.isOpeningEditor = false;
    }
}
class Editor {
    constructor(core, textEditor) {
        this.core = core;
        this.textEditor = textEditor;
        this.goal = new GoalManager(textEditor);
        this.highlighting = new HighlightManager(this);
        this.mouseHighlighting = new MouseHighlightManager(this);
        this.runningInfo = new RunningInfoManager;
    }
    getTextEditor() {
        return this.textEditor;
    }
    warnOutOfGoal() {
        this.core.view.set('Out of goal', 'For this command, please place the cursor in a goal', 4 /* Warning */);
    }
    warnEmptyGoal(error) {
        this.core.view.set('No content', error.message, 4 /* Warning */);
    }
    //////////////////
    //  Filesystem  //
    //////////////////
    save() {
        return new Promise(resolve => {
            this.textEditor.save().then(() => {
                resolve();
            });
        });
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
        return new atom_1.Range(start, end);
    }
    /////////////////////////
    //  Cursor Management  //
    /////////////////////////
    // shift cursor if in certain goal
    protectCursor(callback) {
        const position = this.textEditor.getCursorBufferPosition();
        const result = callback();
        return this.goal.pointing(position)
            .then((goal) => {
            // reposition the cursor in the goal only if it's a fresh hole (coming from '?')
            const isFreshHole = goal.isEmpty();
            if (isFreshHole) {
                const newPosition = this.translate(atom_1.Point.fromObject(goal.range.start), 3);
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
        const textEditorElement = atom.views.getView(this.textEditor);
        textEditorElement.focus();
    }
    jumpToNextGoal() {
        const cursor = this.textEditor.getCursorBufferPosition();
        let nextGoal = null;
        const positions = this.goal.getAll().map((goal) => {
            return this.translate(atom_1.Point.fromObject(goal.range.start), 3);
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
            return this.translate(atom_1.Point.fromObject(goal.range.start), 3);
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
        const goal = this.goal.find(index);
        if (goal) {
            const position = this.translate(atom_1.Point.fromObject(goal.range.start), 3);
            this.textEditor.setCursorBufferPosition(position);
            this.focus();
        }
    }
    jumpToRange(range) {
        this.focus();
        const atomRange = Position_1.Range.toAtomRanges(range)[0];
        if (range.source) {
            // global
            atom.workspace.open(range.source)
                .then((editor) => {
                // jump to a specific place iff it's specified
                if (atomRange) {
                    editor.setSelectedBufferRange(atomRange, {
                        reversed: true
                    });
                }
            });
        }
        else {
            // goal-specific
            this.goal.pointing()
                .then((goal) => {
                let range;
                if (atomRange.start.row === 0) {
                    range = atomRange
                        .translate(goal.range.start)
                        .translate([0, 3]); // hole boundary
                }
                else {
                    range = atomRange
                        .translate([goal.range.start.row, 0]);
                }
                this.textEditor.setSelectedBufferRange(range, {
                    reversed: true
                });
            }).catch(() => this.warnOutOfGoal());
        }
    }
    mouseOver(range) {
        this.mouseHighlighting.mark(range);
    }
    mouseOut() {
        this.mouseHighlighting.unmark();
    }
    ////////////////////////
    //  Command Handlers  //
    ////////////////////////
    onInteractionPoints(indices, fileType) {
        return this.protectCursor(() => {
            const textRaw = this.textEditor.getText();
            this.goal.removeAll();
            const goals = parser_1.parseHole(textRaw, indices, fileType).map((hole) => {
                const range = this.fromIndexRange(hole.originalRange);
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
            const goal = this.goal.find(index);
            goal.setContent(content);
            return goal;
        });
    }
    // Give_Paren  : ["agda2-give-action", 1, "paren"]
    // Give_NoParen: ["agda2-give-action", 1, "no-paren"]
    // Give_String : ["agda2-give-action", 0, ...]
    onGiveAction(index, giveResult, result) {
        return this.protectCursor(() => {
            const goal = this.goal.find(index);
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
            const position = this.fromIndex(charIndex - 1);
            this.textEditor.setCursorBufferPosition(position);
        }
        return Promise.resolve();
    }
    // Agda generates files with syntax highlighting notations,
    // those files are temporary and should be deconsted once used.
    // note: no highlighting yet, we'll just deconste them.
    onHighlightLoadAndDeconste(filepath) {
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
        const goals = this.goals.filter((goal) => { return goal.index === index; });
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
        const range = new atom_1.Range(start, end);
        const marker = this.editor.getTextEditor().markBufferRange(range);
        this.markers.push(marker);
        this.editor.getTextEditor().decorateMarker(marker, {
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
class MouseHighlightManager {
    constructor(editor) {
        this.editor = editor;
    }
    mark(agdaRange) {
        const range = Position_1.Range.toAtomRanges(agdaRange)[0];
        if (range) {
            this.marker = this.editor.getTextEditor().markBufferRange(range);
            this.editor.getTextEditor().decorateMarker(this.marker, {
                type: 'highlight',
                class: `highlight-decoration hover`
            });
        }
    }
    unmark() {
        this.marker.destroy();
        this.marker = null;
    }
}
//# sourceMappingURL=editor.js.map