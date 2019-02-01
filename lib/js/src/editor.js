"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const Promise = require("bluebird");
const _ = require("lodash");
const parser_1 = require("./parser");
const error_1 = require("./error");
// import Goal from './editor/goal';
const GoalRE = require('./Reason/Goal.bs');
const EditorRE = require('./Reason/Editors.bs');
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
        this.goals = [];
        this.highlighting = new HighlightManager(this);
        this.mouseHighlighting = new MouseHighlightManager(this);
        this.runningInfo = new RunningInfoManager;
    }
    getTextEditor() {
        return this.textEditor;
    }
    warnOutOfGoal() {
        this.core.view.setPlainText('Out of goal', 'For this command, please place the cursor in a goal', 'warning');
    }
    warnEmptyGoal(error) {
        this.core.view.setPlainText('No content', error.message, 'warning');
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
    // TODO: temporary
    pointing(cursor = this.textEditor.getCursorBufferPosition()) {
        const holes = this.goals.filter((hole) => {
            return GoalRE.range(hole).containsPoint(cursor, false);
        });
        if (_.isEmpty(holes))
            return Promise.reject(new error_1.OutOfGoalError('out of goal'));
        else
            return Promise.resolve(holes[0]);
    }
    // shift cursor if in certain goal
    protectCursor(callback) {
        const position = this.textEditor.getCursorBufferPosition();
        const result = callback();
        const goal = EditorRE.jsGoalsPointingAt(position, this.goals);
        if (goal) {
            // reposition the cursor in the goal only if it's a fresh hole (coming from '?')
            const isFreshHole = GoalRE.isEmpty(goal);
            if (isFreshHole) {
                const newPosition = this.translate(atom_1.Point.fromObject(GoalRE.range(goal).start), 3);
                setTimeout(() => {
                    this.textEditor.setCursorBufferPosition(newPosition);
                });
            }
            else {
                this.textEditor.setCursorBufferPosition(position);
            }
        }
        else {
            this.textEditor.setCursorBufferPosition(position);
        }
        return Promise.resolve(result);
    }
    focus() {
        const textEditorElement = atom.views.getView(this.textEditor);
        textEditorElement.focus();
    }
    jumpToNextGoal() {
        const cursor = this.textEditor.getCursorBufferPosition();
        let nextGoal = null;
        const positions = this.goals.map((goal) => {
            return this.translate(atom_1.Point.fromObject(GoalRE.range(goal).start), 3);
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
        const positions = this.goals.map((goal) => {
            return this.translate(atom_1.Point.fromObject(GoalRE.range(goal).start), 3);
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
        const goal = EditorRE.jsGoalsFind(index, this.goals);
        if (goal) {
            const position = this.translate(atom_1.Point.fromObject(GoalRE.range(goal).start), 3);
            this.textEditor.setCursorBufferPosition(position);
            this.focus();
        }
    }
    jumpToRange(range, source) {
        this.focus();
        if (source) {
            // global
            atom.workspace.open(source)
                .then((editor) => {
                // jump to a specific place iff it's specified
                editor.setSelectedBufferRange(range, {
                    reversed: true
                });
            });
        }
        else {
            // goal-specific
            const cursor = this.textEditor.getCursorBufferPosition();
            const goal = EditorRE.jsGoalsPointingAt(cursor, this.goals);
            if (goal) {
                let tempRange;
                if (range.start.row === 0) {
                    tempRange = range
                        .translate(GoalRE.range(goal).start)
                        .translate([0, 3]); // hole boundary
                }
                else {
                    tempRange = range
                        .translate([GoalRE.range(goal).start.row, 0]);
                }
                this.textEditor.setSelectedBufferRange(tempRange, {
                    reversed: true
                });
            }
            else {
                this.warnOutOfGoal();
            }
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
            EditorRE.jsGoalsDestroyAll(this.goals);
            this.goals = parser_1.parseHole(textRaw, indices, fileType).map((goal) => {
                const range = this.fromIndexRange(goal.originalRange);
                this.textEditor.setTextInBufferRange(range, goal.content);
                return GoalRE.make(this.textEditor, goal.index, goal.modifiedRange.start, goal.modifiedRange.end);
            });
        });
    }
    onSolveAll(index, content) {
        return this.protectCursor(() => {
            const goal = EditorRE.jsGoalsFind(index, this.goals);
            GoalRE.setContent(goal, content);
            return goal;
        });
    }
    // Give_Paren  : ["agda2-give-action", 1, "paren"]
    // Give_NoParen: ["agda2-give-action", 1, "no-paren"]
    // Give_String : ["agda2-give-action", 0, ...]
    onGiveAction(index, giveResult, result) {
        console.log("onGiveAction", index, giveResult, result);
        return this.protectCursor(() => {
            const goal = EditorRE.jsGoalsFind(index, this.goals);
            switch (giveResult) {
                case 'Paren':
                    result = GoalRE.getContent(goal);
                    GoalRE.setContent(goal, `(${result})`);
                    break;
                case 'NoParen':
                    // do nothing
                    break;
                case 'String':
                    result = result.replace(/\\n/g, '\n');
                    GoalRE.setContent(goal, result);
                    break;
            }
            GoalRE.removeBoundary(goal);
            EditorRE.jsGoalsDestroy(index, this.goals);
        });
    }
    onMakeCase(variant, result) {
        return this.protectCursor(() => {
            const cursor = this.textEditor.getCursorBufferPosition();
            const goal = EditorRE.jsGoalsPointingAt(cursor, this.goals);
            if (goal) {
                switch (variant) {
                    case 'Function':
                        GoalRE.writeLines(goal, result);
                        break;
                    case 'ExtendedLambda':
                        GoalRE.writeLambda(goal, result);
                        break;
                }
            }
            else {
                this.warnOutOfGoal();
            }
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
// class HoleManager {
//     private holes: any[];
//
//     constructor(private textEditor: Atom.TextEditor) {
//         this.holes = [];
//     }
//
//     getAll(): any[] {
//         return this.holes;
//     }
//
//     setAll(goals: any[]) {
//         this.holes = goals;
//     }
//
//     remove(index: number) {
//         this.holes
//             .filter((hole) => { return GoalRE.index(hole) === index; })
//             .forEach((hole) => { GoalRE.destroy(hole); });
//         this.holes = this.holes
//                 .filter((hole) => { return GoalRE.index(hole) !== index; })
//     }
//
//     removeAll() {
//         this.holes.forEach((hole) => {
//             GoalRE.destroy(hole);
//         });
//         this.holes = [];
//     }
//
//     find(index: number): any {
//         const holes = this.holes.filter((hole) => { return GoalRE.index(hole) === index; })
//         return holes[0];
//     }
//
//     // the goal where the cursor is positioned
//     pointing(cursor = this.textEditor.getCursorBufferPosition()): Promise<any> {
//         const holes = this.holes.filter((hole) => {
//             return GoalRE.range(hole).containsPoint(cursor, false);
//         });
//
//         if (_.isEmpty(holes))
//             return Promise.reject(new OutOfGoalError('out of goal'));
//         else
//             return Promise.resolve(holes[0]);
//     }
//
//     // reject if goal is empty
//     guardGoalHasContent(hole): Promise<any> {
//         if (GoalRE.getContent(hole)) {
//             return Promise.resolve(hole);
//         } else {
//             return Promise.reject(new EmptyGoalError('goal is empty', hole));
//         }
//     }
//
//
// }
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
    mark(range) {
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