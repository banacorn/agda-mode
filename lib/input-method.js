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
        return {
            translation: undefined,
            further: false,
            keySuggestions: [],
            candidateSymbols: [],
        };
    }
}
exports.translate = translate;
var InputMethod = (function () {
    function InputMethod(core) {
        var _this = this;
        this.core = core;
        this.dispatchEvent = function (event) {
            if (!_this.mute) {
                var rangeOld = new Range(event.oldTailBufferPosition, event.oldHeadBufferPosition);
                var rangeNew = new Range(event.newTailBufferPosition, event.newHeadBufferPosition);
                var buffer = _this.editor.getBuffer().getTextInRange(rangeNew);
                var INSERT = -1;
                var DELETE = 1;
                var change = rangeNew.compare(rangeOld);
                if (rangeNew.isEmpty()) {
                    _this.deactivate();
                }
                else if (change === INSERT) {
                    var char = buffer.substr(-1);
                    _this.core.view.store.dispatch(actions_1.insertInputMethod(char));
                    var _a = _this.core.view.store.getState().inputMethod, translation_1 = _a.translation, further = _a.further;
                    if (translation_1) {
                        _this.muteEvent(function () {
                            _this.replaceBuffer(translation_1);
                        });
                    }
                    if (!further) {
                        _this.deactivate();
                    }
                }
                else if (change === DELETE) {
                    _this.core.view.store.dispatch(actions_1.deleteInputMethod());
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
            this.activated = true;
            var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.add("agda-mode-input-method-activated");
            var inputEditorFocused = this.core.viewLegacy.$refs.inputEditor.isFocused();
            this.editor = inputEditorFocused ? this.core.viewLegacy.$refs.inputEditor.$el.getModel() : this.core.editor;
            var startPosition = this.editor.getCursorBufferPosition();
            this.textEditorMarker = this.editor.markBufferRange(new Range(startPosition, startPosition), {});
            this.textEditorMarker.onDidChange(this.dispatchEvent);
            this.decoration = this.editor.decorateMarker(this.textEditorMarker, {
                type: "highlight",
                class: "agda-input-method"
            });
            this.muteEvent(function () {
                _this.insertCharToBufffer("\\");
            });
            this.core.view.store.dispatch(actions_1.activateInputMethod());
        }
        else {
            this.deactivate();
        }
    };
    InputMethod.prototype.deactivate = function () {
        if (this.activated) {
            var editorElement = atom.views.getView(atom.workspace.getActiveTextEditor());
            editorElement.classList.remove("agda-mode-input-method-activated");
            this.core.view.store.dispatch(actions_1.deactivateInputMethod());
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
    InputMethod.prototype.insertCharToBufffer = function (char) {
        this.editor.getBuffer().insert(this.textEditorMarker.getBufferRange().end, char);
    };
    InputMethod.prototype.replaceBuffer = function (str) {
        this.editor.getBuffer().setTextInRange(this.textEditorMarker.getBufferRange(), str);
    };
    return InputMethod;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputMethod;
//# sourceMappingURL=input-method.js.map