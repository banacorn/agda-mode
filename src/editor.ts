import * as fs from 'fs';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { Agda, View } from './type';

import { parseHole, parseFilepath } from './parser';
import { Core } from './core';
import { OutOfGoalError, EmptyGoalError } from './error';
// import Goal from './editor/goal';
const HoleRE = require('./Reason/Hole.bs');

import { Point, Range } from 'atom';
import * as Atom from 'atom';

class RunningInfoManager {
    private isOpeningEditor: boolean;
    private editor: Atom.TextEditor;
    private buffer: string[];

    constructor() {
        this.isOpeningEditor = false;
        this.editor = undefined;
        this.buffer = [];
    }

    add(info: string) {
        if (this.editor) {
            this.editor.insertText(info);
        } else {
            if (this.isOpeningEditor) {
                this.buffer.push(info);
            } else {
                this.isOpeningEditor = true;
                atom.workspace.open(undefined, {
                    activateItem: false
                }).then(editor => {
                    this.editor = <Atom.TextEditor>editor;
                    this.editor.insertText(this.buffer.join(''));
                    this.editor.onDidDestroy(() => {
                        this.destroy();
                    })
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
        } else {
            if (this.isOpeningEditor) {
                this.buffer = [];
            } else {
                this.isOpeningEditor = true;
                atom.workspace.open(undefined, {
                    activateItem: false
                }).then(editor => {
                    this.editor = <Atom.TextEditor>editor;
                    this.editor.insertText('');
                    this.editor.onDidDestroy(() => {
                        this.destroy();
                    })
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


export default class Editor {

    private core: Core;
    private textEditor: Atom.TextEditor;
    private mouseHighlighting: MouseHighlightManager;
    public highlighting: HighlightManager;
    public holes: HoleManager;

    public runningInfo: RunningInfoManager;


    constructor(core: Core, textEditor: Atom.TextEditor) {
        this.core = core;
        this.textEditor = textEditor;
        this.holes = new HoleManager(textEditor);
        this.highlighting = new HighlightManager(this);
        this.mouseHighlighting = new MouseHighlightManager(this);


        this.runningInfo = new RunningInfoManager;
    }

    getTextEditor(): Atom.TextEditor {
        return this.textEditor;
    }


    warnOutOfGoal() {
        this.core.view.setPlainText('Out of goal', 'For this command, please place the cursor in a goal', 'warning');
    }

    warnEmptyGoal(error: any) {
        this.core.view.setPlainText('No content', error.message, 'warning');
    }

    //////////////////
    //  Filesystem  //
    //////////////////

    save(): Promise<void> {
        return new Promise(resolve => {
            this.textEditor.save().then(() => {
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

    fromIndex(ind: number): Point {
        return this.textEditor.getBuffer().positionForCharacterIndex(ind);
    }
    toIndex(pos: Point): number {
        return this.textEditor.getBuffer().characterIndexForPosition(pos);
    }
    translate(pos: Point, n: number): Point {
        return this.fromIndex((this.toIndex(pos)) + n)
    }

    fromIndexRange(range: { start: number, end: number }): Range {
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
        return this.holes.pointing(position)
            .then((hole) => {
                // reposition the cursor in the goal only if it's a fresh hole (coming from '?')
                const isFreshHole = HoleRE.isEmpty(hole);
                if (isFreshHole) {
                    const newPosition = this.translate(Point.fromObject(HoleRE.range(hole).start), 3);
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
        const positions = this.holes.getAll().map((hole) => {
            return this.translate(Point.fromObject(HoleRE.range(hole).start), 3);
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

        const positions = this.holes.getAll().map((hole) => {
            return this.translate(Point.fromObject(HoleRE.range(hole).start), 3);
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
        const hole = this.holes.find(index);
        if (hole) {
            const position = this.translate(Point.fromObject(HoleRE.range(hole).start), 3);
            this.textEditor.setCursorBufferPosition(position);
            this.focus();
        }
    }

    jumpToRange(range: Range, source: string) {
        this.focus();

        if (source) {
            // global
            atom.workspace.open(source)
                .then((editor: Atom.TextEditor) => {
                    // jump to a specific place iff it's specified
                        editor.setSelectedBufferRange(range, {
                            reversed: true
                        });
                })
        } else {
            // goal-specific
            this.holes.pointing()
                .then((hole) => {
                    let tempRange;
                    if (range.start.row === 0) {
                        tempRange = range
                            .translate(HoleRE.range(hole).start)
                            .translate([0, 3]);  // hole boundary
                    } else {
                        tempRange = range
                            .translate([HoleRE.range(hole).start.row, 0]);
                    }
                    this.textEditor.setSelectedBufferRange(tempRange, {
                        reversed: true
                    });
                }).catch(() => this.warnOutOfGoal());
        }
    }

    mouseOver(range: Atom.Range) {
        this.mouseHighlighting.mark(range);
    }

    mouseOut() {
        this.mouseHighlighting.unmark();
    }

    ////////////////////////
    //  Command Handlers  //
    ////////////////////////

    onInteractionPoints(indices: number[], fileType: Agda.FileType): Promise<void> {
        return this.protectCursor(() => {
            const textRaw = this.textEditor.getText();
            this.holes.removeAll();
            const holes = parseHole(textRaw, indices, fileType).map((hole) => {
                const range = this.fromIndexRange(hole.originalRange);
                this.textEditor.setTextInBufferRange(range, hole.content);
                return HoleRE.make(this.textEditor, hole.index, hole.modifiedRange.start, hole.modifiedRange.end);
            });
            this.holes.setAll(holes);
        });
    }

    onSolveAll(index: number, content: string): Promise<any> {
        return this.protectCursor(() => {
            const hole = this.holes.find(index);
            HoleRE.setContent(hole, content);
            return hole;
        });
    }


    // Give_Paren  : ["agda2-give-action", 1, "paren"]
    // Give_NoParen: ["agda2-give-action", 1, "no-paren"]
    // Give_String : ["agda2-give-action", 0, ...]
    onGiveAction(index: number, giveResult: 'Paren' | 'NoParen' | 'String', result: string): Promise<void> {
        return this.protectCursor(() => {
            const hole = this.holes.find(index);

            switch (giveResult) {
                case 'Paren':
                    result = HoleRE.getContent(hole);
                    HoleRE.setContent(hole, `(${result})`);
                    break;
                case 'NoParen':
                    // do nothing
                    break;
                case 'String':
                    result = result.replace(/\\n/g, '\n');
                    HoleRE.setContent(hole, result);
                    break;
            }
            HoleRE.removeBoundary(hole);
            this.holes.remove(index);
        });
    }

    onMakeCase(variant: 'Function' | 'ExtendedLambda', result: string[]): Promise<void> {
        return this.protectCursor(() => {
            this.holes.pointing().then((hole) => {
                switch (variant) {
                    case 'Function':
                        HoleRE.writeLines(hole, result);
                        break;
                    case 'ExtendedLambda':
                        HoleRE.writeLambda(hole, result);
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

class HoleManager {
    private holes: any[];

    constructor(private textEditor: Atom.TextEditor) {
        this.holes = [];
    }

    getAll(): any[] {
        return this.holes;
    }

    setAll(goals: any[]) {
        this.holes = goals;
    }

    remove(index: number) {
        this.holes
            .filter((hole) => { return HoleRE.index(hole) === index; })
            .forEach((hole) => { HoleRE.destroy(hole); });
        this.holes = this.holes
                .filter((hole) => { return HoleRE.index(hole) !== index; })
    }

    removeAll() {
        this.holes.forEach((hole) => {
            HoleRE.destroy(hole);
        });
        this.holes = [];
    }

    find(index: number): any {
        const holes = this.holes.filter((hole) => { return HoleRE.index(hole) === index; })
        return holes[0];
    }

    // the goal where the cursor is positioned
    pointing(cursor = this.textEditor.getCursorBufferPosition()): Promise<any> {
        const holes = this.holes.filter((hole) => {
            return HoleRE.range(hole).containsPoint(cursor, false);
        });

        if (_.isEmpty(holes))
            return Promise.reject(new OutOfGoalError('out of goal'));
        else
            return Promise.resolve(holes[0]);
    }

    // reject if goal is empty
    guardGoalHasContent(hole): Promise<any> {
        if (HoleRE.getContent(hole)) {
            return Promise.resolve(hole);
        } else {
            return Promise.reject(new EmptyGoalError('goal is empty', hole));
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
        this.editor.getTextEditor().decorateMarker(marker, {
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


class MouseHighlightManager {
    private marker: any;

    constructor(private editor: Editor) {
    }

    mark(range: Atom.Range) {
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
