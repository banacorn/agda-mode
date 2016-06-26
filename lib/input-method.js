"use strict";
var Keymap = require("./input-method/keymap");
var _a = require('atom'), Range = _a.Range, CompositeDisposable = _a.CompositeDisposable;
var InputMethod = (function () {
    function InputMethod(core) {
        var _this = this;
        this.core = core;
        this.dispatchEvent = function (event) {
            if (!_this.mute) {
                var rangeOld = new Range(event.oldTailBufferPosition, event.oldHeadBufferPosition);
                var rangeNew = new Range(event.newTailBufferPosition, event.newHeadBufferPosition);
                var buffer = _this.editor.getBuffer().getTextInRange(rangeNew);
                var char = buffer.substr(-1);
                var INSERT = -1;
                var DELETE = 1;
                var change = rangeNew.compare(rangeOld);
                if (rangeNew.isEmpty()) {
                    _this.deactivate();
                }
                else if (change === INSERT) {
                    var char_1 = buffer.substr(-1);
                    _this.rawInput += char_1;
                    var _a = Keymap.translate(_this.rawInput), translation_1 = _a.translation, further = _a.further, suggestionKeys = _a.suggestionKeys, candidateSymbols = _a.candidateSymbols;
                    if (translation_1) {
                        _this.muteEvent(function () {
                            _this.replaceString(translation_1);
                        });
                    }
                    if (further) {
                        _this.core.view.inputMethod = {
                            rawInput: _this.rawInput,
                            suggestionKeys: suggestionKeys,
                            candidateSymbols: candidateSymbols
                        };
                    }
                    else {
                        _this.deactivate();
                    }
                }
                else if (change === DELETE) {
                    _this.rawInput = _this.rawInput.substr(0, _this.rawInput.length - 1);
                    var _b = Keymap.translate(_this.rawInput), translation = _b.translation, further = _b.further, suggestionKeys = _b.suggestionKeys, candidateSymbols = _b.candidateSymbols;
                    _this.core.view.inputMethod = {
                        rawInput: _this.rawInput,
                        suggestionKeys: suggestionKeys,
                        candidateSymbols: candidateSymbols
                    };
                }
            }
        };
        this.activated = false;
        this.mute = false;
        this.subscriptions = new CompositeDisposable;
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
            var inputEditorFocused = this.core.view.$refs.inputEditor.isFocused();
            this.editor = inputEditorFocused ? this.core.view.$refs.inputEditor.$el.getModel() : this.core.editor;
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
            this.core.view.inputMethodMode = true;
            this.core.view.inputMethod = {
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
            this.core.view.inputMethodMode = false;
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
