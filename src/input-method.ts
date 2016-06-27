import * as _ from "lodash";
import Keymap from "./keymap";
import Core from "./core";

type TextEditor = any;
type CompositeDisposable = any;
type Decoration = any;
type TextEditorMarker = any;
type Range = any;
declare var atom: any;
var { Range, CompositeDisposable } = require('atom');

function getSuggestionKeys(trie: any): string[] {
    return Object.keys(_.omit(trie, ">>"));
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
function translate(input: string): {
    translation: string,
    further: boolean,
    suggestionKeys: string[],
    candidateSymbols: string[]
} {
    const {valid, trie} = validate(input);
    const suggestionKeys   = getSuggestionKeys(trie);
    const candidateSymbols = getCandidateSymbols(trie);
    if (valid) {
        if (suggestionKeys.length === 0) {
            return {
                translation: candidateSymbols[0],
                further: false,
                suggestionKeys: [],
                candidateSymbols: []
            }
        } else {
            return {
                translation: candidateSymbols[0],
                further: true,
                suggestionKeys: suggestionKeys,
                candidateSymbols: candidateSymbols
            }
        }
    } else {
        // key combination out of keymap
        // replace with closest the symbol possible
        return {
            translation: undefined,
            further: false,
            suggestionKeys: [],
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
    // raw characters
    rawInput: string;

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
            this.rawInput = ""
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
                this.insertChar("\\");
            });

            // initialize input suggestion
            this.core.view.inputMethodMode = true;
            this.core.view.inputMethodInput = {
                rawInput: "",
                suggestionKeys: getSuggestionKeys(Keymap).sort(),
                candidateSymbols: []
            }
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

            this.core.view.inputMethodMode = false;
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
            const char = buffer.substr(-1);

            // const for result of Range::compare()
            const INSERT = -1;
            const DELETE = 1;
            const change = rangeNew.compare(rangeOld);

            if (rangeNew.isEmpty()) {
                this.deactivate();
            }
            else if (change === INSERT) {
                const char = buffer.substr(-1);
                this.rawInput += char;
                const {translation, further, suggestionKeys, candidateSymbols} = translate(this.rawInput);

                // reflects current translation to the text buffer
                if (translation) {
                    this.muteEvent(() => {
                        this.replaceString(translation);
                    });
                }

                // update view
                if (further) {
                    this.core.view.inputMethodInput = {
                        rawInput: this.rawInput,
                        suggestionKeys: suggestionKeys,
                        candidateSymbols: candidateSymbols
                    };
                } else {
                    this.deactivate();
                }
            } else if (change === DELETE) {
                this.rawInput = this.rawInput.substr(0, this.rawInput.length - 1);
                const {translation, further, suggestionKeys, candidateSymbols} = translate(this.rawInput);
                this.core.view.inputMethodInput = {
                    rawInput: this.rawInput,
                    suggestionKeys: suggestionKeys,
                    candidateSymbols: candidateSymbols
                };
            }

        }
    }

    ///////////////////
    //  Text Buffer  //
    ///////////////////

    // inserts 1 character to the text buffer (may trigger some events)
    insertChar(char: string) {
        this.editor.getBuffer().insert(this.textEditorMarker.getBufferRange().end, char);
    }

    //  inserts 1 symbol to the text buffer and deactivate
    insertSymbol(symbol: string) {
        this.replaceString(symbol);
        this.deactivate()

    }

    // replace content of the marker with supplied string (may trigger some events)
    replaceString(str: string) {
        this.editor.getBuffer().setTextInRange(this.textEditorMarker.getBufferRange(), str);
    }
}
