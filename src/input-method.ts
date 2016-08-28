import * as _ from "lodash";
import Keymap from "./keymap";
import Core from "./core";
import { activateInputMethod, deactivateInputMethod, insertInputMethod, deleteInputMethod } from "./view/actions";

type TextEditor = any;
type CompositeDisposable = any;
type Decoration = any;
type TextEditorMarker = any;
type Range = any;
declare var atom: any;
var { Range, CompositeDisposable } = require('atom');

function getKeySuggestions(trie: any): string[] {
    return Object.keys(_.omit(trie, ">>")).sort();
}

function getCandidateSymbols(trie: any): string[] {
    return trie[">>"];
}

// see if input is in the keymap
function validate(input: string): {
    valid: boolean,
    trie: any
} {
    let trie = Keymap;
    let valid = true;
    for (var char of input) {
        const next = trie[char];
        if (next) {
            trie = next;
        } else {
            valid = false;
            break;
        }
    }
    return {
        valid: valid,
        trie: trie
    };
}

// converts characters to symbol, and tells if there's any further possible combinations
export function translate(input: string): {
    translation: string,
    further: boolean,
    keySuggestions: string[],
    candidateSymbols: string[]
} {
    const {valid, trie} = validate(input);
    const keySuggestions   = getKeySuggestions(trie);
    const candidateSymbols = getCandidateSymbols(trie);
    if (valid) {
        if (keySuggestions.length === 0) {
            return {
                translation: candidateSymbols[0],
                further: false,
                keySuggestions: [],
                candidateSymbols: []
            }
        } else {
            return {
                translation: candidateSymbols[0],
                further: true,
                keySuggestions: keySuggestions,
                candidateSymbols: candidateSymbols
            }
        }
    } else {
        // key combination out of keymap
        // replace with closest the symbol possible
        return {
            translation: undefined,
            further: false,
            keySuggestions: [],
            candidateSymbols: [],
        }
    }
}


// Input Method Singleton (initialized only once per editor, activated or not)
export default class InputMethod {
    private activated: boolean;
    private mute: boolean;
    private subscriptions: CompositeDisposable;
    private editor: TextEditor;
    private decoration: Decoration;

    // visual marker
    textEditorMarker: TextEditorMarker;


    constructor(private core: Core) {
        this.activated = false;
        this.mute = false;
        this.subscriptions = new CompositeDisposable;

        // intercept newline `\n` as confirm
        const commands = (event) => {
            if (this.activated) {
                this.deactivate();
                event.stopImmediatePropagation();
            }
        }
        this.subscriptions.add(atom.commands.add(
            "atom-text-editor.agda-mode-input-method-activated",
            "editor:newline",
            commands
        ));
    }

    destroy() {
        this.subscriptions.dispose();
    }

    activate() {
        if (!this.activated) {
            // initializations
            this.activated = true;

            // add class "agda-mode-input-method-activated"
            const editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.add("agda-mode-input-method-activated");

            // editor: the main text editor or the mini text editor
            const inputEditorFocused = this.core.view.$refs.inputEditor.isFocused();
            this.editor = inputEditorFocused ? this.core.view.$refs.inputEditor.$el.getModel() : this.core.editor;

            // monitors raw text buffer and figures out what happend
            const startPosition = this.editor.getCursorBufferPosition();
            this.textEditorMarker = this.editor.markBufferRange(new Range(startPosition, startPosition), {});
            this.textEditorMarker.onDidChange(this.dispatchEvent);

            // decoration
            this.decoration = this.editor.decorateMarker(this.textEditorMarker, {
                type: "highlight",
                class: "agda-input-method"
            });

            // insert '\' at the cursor quitely without triggering any shit
            this.muteEvent(() => {
                this.insertCharToBufffer("\\");
            });

            // initialize input suggestion
            this.core.store.dispatch(activateInputMethod());
        } else {
            // input method already activated
            // this will happen when the 2nd backslash '\' got punched in
            // we shall leave 1 backslash in the buffer, then deactivate
            this.deactivate();
        }
    }

    deactivate() {
        if (this.activated) {
            // add class 'agda-mode-input-method-activated'
            const editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.remove("agda-mode-input-method-activated");
            this.core.store.dispatch(deactivateInputMethod());
            this.textEditorMarker.destroy();
            this.decoration.destroy();
            this.activated = false;
        }
    }

    //////////////
    //  Events  //
    //////////////

    muteEvent(callback: Function) {
        this.mute = true;
        callback();
        this.mute = false;
    }

    public dispatchEvent = (event: any) => {
        if (!this.mute) {
            const rangeOld = new Range(event.oldTailBufferPosition, event.oldHeadBufferPosition);
            const rangeNew = new Range(event.newTailBufferPosition, event.newHeadBufferPosition);
            const buffer = this.editor.getBuffer().getTextInRange(rangeNew);

            // const for result of Range::compare()
            const INSERT = -1;
            const DELETE = 1;
            const change = rangeNew.compare(rangeOld);

            if (rangeNew.isEmpty()) {
                this.deactivate();
            }
            else if (change === INSERT) {
                const char = buffer.substr(-1);
                this.core.store.dispatch(insertInputMethod(char));
                const {translation, further} = this.core.store.getState().inputMethod;

                // reflects current translation to the text buffer
                if (translation) {
                    this.muteEvent(() => {
                        this.replaceBuffer(translation);
                    });
                }

                // deactivate if we can't go further
                if (!further) {
                    this.deactivate();
                }
            } else if (change === DELETE) {
                this.core.store.dispatch(deleteInputMethod());
            }

        }
    }

    ///////////////////
    //  Text Buffer  //
    ///////////////////

    // inserts 1 character to the text buffer (may trigger some events)
    insertCharToBufffer(char: string) {
        this.editor.getBuffer().insert(this.textEditorMarker.getBufferRange().end, char);
    }

    // replace content of the marker with supplied string (may trigger some events)
    replaceBuffer(str: string) {
        this.editor.getBuffer().setTextInRange(this.textEditorMarker.getBufferRange(), str);
    }
}
