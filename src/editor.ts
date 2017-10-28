import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { Agda, View, Location } from './type';
import { parseHole, parseFilepath } from './parser';
import Core from './core';
import { OutOfGoalError, EmptyGoalError } from './error';
import Goal from './editor/goal';

import { TextEditor, Point, Range } from 'atom';

export default class Editor {

    private core: Core;
    private textEditor: Atom.TextEditor;
    public highlighting: HighlightManager;
    public goal: GoalManager;


    constructor(core: Core, textEditor: Atom.TextEditor) {
        this.core = core;
        this.textEditor = textEditor;
        this.goal = new GoalManager(textEditor);
        this.highlighting = new HighlightManager(this);
    }

    getTextEditor(): Atom.TextEditor {
        return this.textEditor;
    }


    warnOutOfGoal() {
        this.core.view.set('Out of goal', ['For this command, please place the cursor in a goal'], View.Style.Warning);
    }

    warnEmptyGoal(error: any) {
        this.core.view.set('No content', [error.message], View.Style.Warning);
    }

    //////////////////
    //  Filesystem  //
    //////////////////

    save(): Promise<void> {
        return new Promise(resolve => {
            this.textEditor.save().then((e) => {
                resolve();
            });
        })
    }

    getPath(): string {
        return parseFilepath(this.textEditor.getPath());
    }

    ///////////////////////
    //  Index <=> Point  //
    ///////////////////////

    fromIndex(ind: number): TextBuffer.Point {
        return this.textEditor.getBuffer().positionForCharacterIndex(ind);
    }
    toIndex(pos: TextBuffer.Point): number {
        return this.textEditor.getBuffer().characterIndexForPosition(pos);
    }
    translate(pos: TextBuffer.Point, n: number): TextBuffer.Point {
        return this.fromIndex((this.toIndex(pos)) + n)
    }

    fromIndexRange(range: { start: number, end: number }): TextBuffer.Range {
        const start = this.fromIndex(range.start);
        const end   = this.fromIndex(range.end);
        return new Range(start, end);
    }

    /////////////////////////
    //  Cursor Management  //
    /////////////////////////

    // shift cursor if in certain goal
    protectCursor<T>(callback: () => T): Promise<T> {
        const position = this.textEditor.getCursorBufferPosition();
        const result = callback();
        return this.goal.pointing(position)
            .then((goal) => {
                // reposition the cursor in the goal only if it's a fresh hole (coming from '?')
                const isFreshHole = goal.isEmpty();
                if (isFreshHole) {
                    const newPosition = this.translate(Point.fromObject(goal.range.start), 3);
                    setTimeout(() => {
                        this.textEditor.setCursorBufferPosition(newPosition);
                    });
                } else {
                    this.textEditor.setCursorBufferPosition(position);
                }
                return result;
            }).catch(OutOfGoalError, () => {
                this.textEditor.setCursorBufferPosition(position);
                return result;
            })
    }

    focus() {
        const textEditorElement = atom.views.getView(this.textEditor);
        textEditorElement.focus();
    }

    jumpToNextGoal(): Promise<{}> {
        const cursor = this.textEditor.getCursorBufferPosition();
        let nextGoal = null;
        const positions = this.goal.getAll().map((goal) => {
            return this.translate(Point.fromObject(goal.range.start), 3);
        });

        positions.forEach((position) => {
            if (position.isGreaterThan(cursor) && nextGoal === null) {
                nextGoal = position;
            }
        });

        // no goal ahead of cursor, loop back
        if (nextGoal === null)
            nextGoal = _.head(positions)

        // jump only when there are goals
        if (!_.isEmpty(positions))
            this.textEditor.setCursorBufferPosition(nextGoal);

        return Promise.resolve({});
    }

    jumpToPreviousGoal(): Promise<{}> {
        const cursor = this.textEditor.getCursorBufferPosition();
        let previousGoal = null;

        const positions = this.goal.getAll().map((goal) => {
            return this.translate(Point.fromObject(goal.range.start), 3);
        });

        positions.forEach((position) => {
            if (position.isLessThan(cursor)) {
                previousGoal = position;
            }
        });

        // no goal ahead of cursor, loop back
        if (previousGoal === null)
            previousGoal = _.last(positions)

        // jump only when there are goals
        if (!_.isEmpty(positions))
            this.textEditor.setCursorBufferPosition(previousGoal);

        return Promise.resolve({});
    }

    jumpToGoal(index: number) {
        const goal = this.goal.find(index);
        if (goal) {
            const position = this.translate(Point.fromObject(goal.range.start), 3);
            this.textEditor.setCursorBufferPosition(position);
            this.focus();
        }
    }

    jumpToLocation(location: Location) {
        this.focus();
        if (location.path) {
            atom.workspace.open(location.path)
                .then((editor: Atom.TextEditor) => {
                    editor.setSelectedBufferRange(location.range, {
                        reversed: true
                    });
                })
        } else {
            this.goal.pointing()
                .then((goal) => {
                    let range;
                    if (location.range.start.row === 0) {
                        range = location.range
                            .translate(goal.range.start)
                            .translate([0, 3]);  // hole boundary
                    } else {
                        range = location.range
                            .translate([goal.range.start.row, 0]);
                    }
                    this.textEditor.setSelectedBufferRange(range, {
                        reversed: true
                    });
                }).catch(() => this.warnOutOfGoal());
        }
    }


    ////////////////////////
    //  Command Handlers  //
    ////////////////////////

    onInteractionPoints(indices: number[]): Promise<void> {
        return this.protectCursor(() => {
            const textRaw = this.textEditor.getText();
            this.goal.removeAll();
            const goals = parseHole(textRaw, indices).map((hole) => {
                const range = this.fromIndexRange(hole.originalRange);
                this.textEditor.setTextInBufferRange(range, hole.content);
                return new Goal(
                    this.textEditor,
                    hole.index,
                    {
                        start: hole.modifiedRange.start,
                        end: hole.modifiedRange.end,
                    }
                );
            });
            this.goal.setAll(goals);
        });
    }

    onSolveAll(index: number, content: string): Promise<Goal> {
        return this.protectCursor(() => {
            const goal = this.goal.find(index);
            goal.setContent(content);
            return goal;
        });
    }


    // Give_Paren  : ["agda2-give-action", 1, "paren"]
    // Give_NoParen: ["agda2-give-action", 1, "no-paren"]
    // Give_String : ["agda2-give-action", 0, ...]
    onGiveAction(index: number, giveResult: 'Paren' | 'NoParen' | 'String', result: string): Promise<void> {
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

    onMakeCase(variant: 'Function' | 'ExtendedLambda', result: string[]): Promise<void> {
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

    onJumpToError(filepath: string, charIndex: number): Promise<void> {
        if (this.getPath() === filepath) {
            const position = this.fromIndex(charIndex - 1);
            this.textEditor.setCursorBufferPosition(position);
        }
        return Promise.resolve();
    }

    // Agda generates files with syntax highlighting notations,
    // those files are temporary and should be deconsted once used.
    // note: no highlighting yet, we'll just deconste them.
    onHighlightLoadAndDeconste(filepath: string): Promise<void> {
        fs.unlink(filepath, () => {});
        return Promise.resolve();
    }
}

class GoalManager {
    private goals: Goal[];

    constructor(private textEditor: Atom.TextEditor) {
        this.goals = [];
    }

    getAll(): Goal[] {
        return this.goals;
    }

    setAll(goals: Goal[]) {
        this.goals = goals;
    }

    remove(index: number) {
        this.goals
            .filter((goal) => { return goal.index === index; })
            .forEach((goal) => { goal.destroy(); });
        this.goals = this.goals
                .filter((goal) => { return goal.index !== index; })
    }

    removeAll() {
        this.goals.forEach((goal) => {
            goal.destroy();
        });
        this.goals = [];
    }

    find(index: number): Goal {
        const goals = this.goals.filter((goal) => { return goal.index === index; })
        return goals[0];
    }

    // the goal where the cursor is positioned
    pointing(cursor = this.textEditor.getCursorBufferPosition()): Promise<Goal> {
        const goals = this.goals.filter((goal) => {
            return goal.range.containsPoint(cursor, false);
        });

        if (_.isEmpty(goals))
            return Promise.reject(new OutOfGoalError('out of goal'));
        else
            return Promise.resolve(goals[0]);
    }

    // reject if goal is empty
    guardGoalHasContent(goal : Goal): Promise<Goal> {
        if (goal.getContent()) {
            return Promise.resolve(goal);
        } else {
            return Promise.reject(new EmptyGoalError('goal is empty', goal));
        }
    }


}

class HighlightManager {
    private markers: any[];

    constructor(private editor: Editor) {
        this.markers = [];
    }

    add(annotation: Agda.Annotation) {
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

    destroyAll(): Promise<void> {
        this.markers.forEach((marker) => { marker.destroy(); });
        this.markers = [];
        return Promise.resolve();
    }
}
