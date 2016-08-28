"use strict";
var _ = require("lodash");
var keymap_1 = require("./keymap");
var actions_1 = require("./view/actions");
var _a = require('atom'), Range = _a.Range, CompositeDisposable = _a.CompositeDisposable;
function getKeySuggestions(trie) {
    return Object.keys(_.omit(trie, ">>")).sort();
}
function getCandidateSymbols(trie) {
    return trie[">>"];
}
// see if input is in the keymap
function validate(input) {
    var trie = keymap_1.default;
    var valid = true;
    for (var _i = 0, input_1 = input; _i < input_1.length; _i++) {
        var char = input_1[_i];
        var next = trie[char];
        if (next) {
            trie = next;
        }
        else {
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
function translate(input) {
    var _a = validate(input), valid = _a.valid, trie = _a.trie;
    var keySuggestions = getKeySuggestions(trie);
    var candidateSymbols = getCandidateSymbols(trie);
    if (valid) {
        if (keySuggestions.length === 0) {
            return {
                translation: candidateSymbols[0],
                further: false,
                keySuggestions: [],
                candidateSymbols: []
            };
        }
        else {
            return {
                translation: candidateSymbols[0],
                further: true,
                keySuggestions: keySuggestions,
                candidateSymbols: candidateSymbols
            };
        }
    }
    else {
        // key combination out of keymap
        // replace with closest the symbol possible
        return {
            translation: undefined,
            further: false,
            keySuggestions: [],
            candidateSymbols: [],
        };
    }
}
exports.translate = translate;
// Input Method Singleton (initialized only once per editor, activated or not)
var InputMethod = (function () {
    function InputMethod(core) {
        var _this = this;
        this.core = core;
        this.dispatchEvent = function (event) {
            if (!_this.mute) {
                var rangeOld = new Range(event.oldTailBufferPosition, event.oldHeadBufferPosition);
                var rangeNew = new Range(event.newTailBufferPosition, event.newHeadBufferPosition);
                var buffer = _this.editor.getBuffer().getTextInRange(rangeNew);
                // const for result of Range::compare()
                var INSERT = -1;
                var DELETE = 1;
                var change = rangeNew.compare(rangeOld);
                if (rangeNew.isEmpty()) {
                    _this.deactivate();
                }
                else if (change === INSERT) {
                    var char = buffer.substr(-1);
                    _this.core.store.dispatch(actions_1.insertInputMethod(char));
                    var _a = _this.core.store.getState().inputMethod, translation_1 = _a.translation, further = _a.further;
                    // reflects current translation to the text buffer
                    if (translation_1) {
                        _this.muteEvent(function () {
                            _this.replaceBuffer(translation_1);
                        });
                    }
                    // deactivate if we can't go further
                    if (!further) {
                        _this.deactivate();
                    }
                }
                else if (change === DELETE) {
                    _this.core.store.dispatch(actions_1.deleteInputMethod());
                }
            }
        };
        this.activated = false;
        this.mute = false;
        this.subscriptions = new CompositeDisposable;
        // intercept newline `\n` as confirm
        var commands = function (event) {
            if (_this.activated) {
                _this.deactivate();
                event.stopImmediatePropagation();
            }
        };
        this.subscriptions.add(atom.commands.add("atom-text-editor.agda-mode-input-method-activated", "editor:newline", commands));
    }
    InputMethod.prototype.destroy = function () {
        this.subscriptions.dispose();
    };
    InputMethod.prototype.activate = function () {
        var _this = this;
        if (!this.activated) {
            // initializations
            this.activated = true;
            // add class "agda-mode-input-method-activated"
            var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.add("agda-mode-input-method-activated");
            // editor: the main text editor or the mini text editor
            var inputEditorFocused = this.core.viewLegacy.$refs.inputEditor.isFocused();
            this.editor = inputEditorFocused ? this.core.viewLegacy.$refs.inputEditor.$el.getModel() : this.core.editor;
            // monitors raw text buffer and figures out what happend
            var startPosition = this.editor.getCursorBufferPosition();
            this.textEditorMarker = this.editor.markBufferRange(new Range(startPosition, startPosition), {});
            this.textEditorMarker.onDidChange(this.dispatchEvent);
            // decoration
            this.decoration = this.editor.decorateMarker(this.textEditorMarker, {
                type: "highlight",
                class: "agda-input-method"
            });
            // insert '\' at the cursor quitely without triggering any shit
            this.muteEvent(function () {
                _this.insertCharToBufffer("\\");
            });
            // initialize input suggestion
            this.core.store.dispatch(actions_1.activateInputMethod());
        }
        else {
            // input method already activated
            // this will happen when the 2nd backslash '\' got punched in
            // we shall leave 1 backslash in the buffer, then deactivate
            this.deactivate();
        }
    };
    InputMethod.prototype.deactivate = function () {
        if (this.activated) {
            // add class 'agda-mode-input-method-activated'
            var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.remove("agda-mode-input-method-activated");
            this.core.store.dispatch(actions_1.deactivateInputMethod());
            this.textEditorMarker.destroy();
            this.decoration.destroy();
            this.activated = false;
        }
    };
    //////////////
    //  Events  //
    //////////////
    InputMethod.prototype.muteEvent = function (callback) {
        this.mute = true;
        callback();
        this.mute = false;
    };
    ///////////////////
    //  Text Buffer  //
    ///////////////////
    // inserts 1 character to the text buffer (may trigger some events)
    InputMethod.prototype.insertCharToBufffer = function (char) {
        this.editor.getBuffer().insert(this.textEditorMarker.getBufferRange().end, char);
    };
    // replace content of the marker with supplied string (may trigger some events)
    InputMethod.prototype.replaceBuffer = function (str) {
        this.editor.getBuffer().setTextInRange(this.textEditorMarker.getBufferRange(), str);
    };
    return InputMethod;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputMethod;
//# sourceMappingURL=input-method.js.map