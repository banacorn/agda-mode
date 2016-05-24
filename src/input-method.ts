import { CompositeDisposable } from "atom";
import Atom = atom.Typings;
var Keymap = require("./input-method/keymap");

// Input Method Singleton (initialized only once per editor, activated or not)
export default class InputMethod {
    private activated: boolean;
    private mute: boolean;
    private subscriptions: CompositeDisposable;
    private editor: Atom.TextEditor;
    private decoration: Atom.Decoration;
    // raw characters
    rawInput: string;

    // visual marker
    textBufferMarker: Atom.Marker;


    constructor(private core: any) {
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
            const inputEditorFocused = this.core.panel.$refs.inputEditor.isFocused();
            this.editor = inputEditorFocused ? this.core.panel.$refs.inputEditor.$el.getModel() : this.core.editor;

            // monitors raw text buffer and figures out what happend
            const startPosition = this.editor.getCursorBufferPosition();
            this.textBufferMarker = this.editor.markBufferRange(new Atom.Range(startPosition, startPosition), {});
            this.textBufferMarker.onDidChange(this.dispatchEvent);

            // decoration
            this.decoration = this.editor.decorateMarker(this.textBufferMarker, {
                type: "highlight",
                class: "agda-input-method"
            });

            // insert '\' at the cursor quitely without triggering any shit
            this.muteEvent(() => {
                this.insertChar("\\");
            });

            // initialize input suggestion
            this.core.panel.inputMethodMode = true;
            this.core.panel.inputMethod = {
                rawInput: "",
                suggestionKeys: Keymap.getSuggestionKeys(Keymap.trie).sort(),
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

            this.core.panel.inputMethodMode = false;
            this.textBufferMarker.destroy();
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

    dispatchEvent(event: any) {
        if (!this.mute) {
            const rangeOld = new Atom.Range(event.oldTailBufferPosition, event.oldHeadBufferPosition);
            const rangeNew = new Atom.Range(event.newTailBufferPosition, event.newHeadBufferPosition);
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
                const {translation, further, suggestionKeys, candidateSymbols} = Keymap.translate(this.rawInput);

                // reflects current translation to the text buffer
                if (translation) {
                    this.muteEvent(() => {
                        this.replaceString(translation);
                    });
                }

                // update view
                if (further) {
                    this.core.panel.inputMethod = {
                        rawInput: this.rawInput,
                        suggestionKeys: suggestionKeys,
                        candidateSymbols: candidateSymbols
                    };
                } else {
                    this.deactivate();
                }
            } else if (change === DELETE) {
                this.rawInput = this.rawInput.substr(0, this.rawInput.length - 1);
                const {translation, further, suggestionKeys, candidateSymbols} = Keymap.translate(this.rawInput);
                this.core.panel.inputMethod = {
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
        this.editor.getBuffer().insert(this.textBufferMarker.getBufferRange().end, char);
    }

    //  inserts 1 symbol to the text buffer and deactivate
    insertSymbol(symbol: string) {
        this.replaceString(symbol);
        this.deactivate()

    }

    // replace content of the marker with supplied string (may trigger some events)
    replaceString(str: string) {
        this.editor.getBuffer().setTextInRange(this.textBufferMarker.getBufferRange(), str);
    }
}
