"use strict";
var atom_1 = require("atom");
var Keymap = require("./input-method/keymap");
var InputMethod = (function () {
    function InputMethod(core) {
        var _this = this;
        this.core = core;
        this.activated = false;
        this.mute = false;
        this.subscriptions = new atom_1.CompositeDisposable;
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
            this.rawInput = "";
            this.activated = true;
            var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.add("agda-mode-input-method-activated");
            var inputEditorFocused = this.core.panel.$refs.inputEditor.isFocused();
            this.editor = inputEditorFocused ? this.core.panel.$refs.inputEditor.$el.getModel() : this.core.editor;
            var startPosition = this.editor.getCursorBufferPosition();
            this.textEditorMarker = this.editor.markBufferRange(new Range(startPosition, startPosition), {});
            this.textEditorMarker.onDidChange(this.dispatchEvent);
            this.decoration = this.editor.decorateMarker(this.textEditorMarker, {
                type: "highlight",
                class: "agda-input-method"
            });
            this.muteEvent(function () {
                _this.insertChar("\\");
            });
            this.core.panel.inputMethodMode = true;
            this.core.panel.inputMethod = {
                rawInput: "",
                suggestionKeys: Keymap.getSuggestionKeys(Keymap.trie).sort(),
                candidateSymbols: []
            };
        }
        else {
            this.deactivate();
        }
    };
    InputMethod.prototype.deactivate = function () {
        if (this.activated) {
            var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.remove("agda-mode-input-method-activated");
            this.core.panel.inputMethodMode = false;
            this.textEditorMarker.destroy();
            this.decoration.destroy();
            this.activated = false;
        }
    };
    InputMethod.prototype.muteEvent = function (callback) {
        this.mute = true;
        callback();
        this.mute = false;
    };
    InputMethod.prototype.dispatchEvent = function (event) {
        var _this = this;
        if (!this.mute) {
            var rangeOld = new Range(event.oldTailBufferPosition, event.oldHeadBufferPosition);
            var rangeNew = new Range(event.newTailBufferPosition, event.newHeadBufferPosition);
            var buffer = this.editor.getBuffer().getTextInRange(rangeNew);
            var char = buffer.substr(-1);
            var INSERT = -1;
            var DELETE = 1;
            var change = rangeNew.compare(rangeOld);
            if (rangeNew.isEmpty()) {
                this.deactivate();
            }
            else if (change === INSERT) {
                var char_1 = buffer.substr(-1);
                this.rawInput += char_1;
                var _a = Keymap.translate(this.rawInput), translation_1 = _a.translation, further = _a.further, suggestionKeys = _a.suggestionKeys, candidateSymbols = _a.candidateSymbols;
                if (translation_1) {
                    this.muteEvent(function () {
                        _this.replaceString(translation_1);
                    });
                }
                if (further) {
                    this.core.panel.inputMethod = {
                        rawInput: this.rawInput,
                        suggestionKeys: suggestionKeys,
                        candidateSymbols: candidateSymbols
                    };
                }
                else {
                    this.deactivate();
                }
            }
            else if (change === DELETE) {
                this.rawInput = this.rawInput.substr(0, this.rawInput.length - 1);
                var _b = Keymap.translate(this.rawInput), translation = _b.translation, further = _b.further, suggestionKeys = _b.suggestionKeys, candidateSymbols = _b.candidateSymbols;
                this.core.panel.inputMethod = {
                    rawInput: this.rawInput,
                    suggestionKeys: suggestionKeys,
                    candidateSymbols: candidateSymbols
                };
            }
        }
    };
    InputMethod.prototype.insertChar = function (char) {
        this.editor.getBuffer().insert(this.textEditorMarker.getBufferRange().end, char);
    };
    InputMethod.prototype.insertSymbol = function (symbol) {
        this.replaceString(symbol);
        this.deactivate();
    };
    InputMethod.prototype.replaceString = function (str) {
        this.editor.getBuffer().setTextInRange(this.textEditorMarker.getBufferRange(), str);
    };
    return InputMethod;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputMethod;
