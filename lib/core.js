"use strict";
var _a = require("atom"), Range = _a.Range, CompositeDisposable = _a.CompositeDisposable;
var parser_1 = require("./parser");
var commander_1 = require("./commander");
var Process = require("./process");
var text_buffer_1 = require("./text-buffer");
var input_method_1 = require("./input-method");
var highlight_manager_1 = require("./highlight-manager");
var Panel = require("./panel");
var Core = (function () {
    function Core(editor) {
        var _this = this;
        this.editor = editor;
        this.editor.fromIndex = function (ind) {
            return _this.editor.getBuffer().positionForCharacterIndex(ind);
        };
        this.editor.toIndex = function (pos) {
            return _this.editor.getBuffer().characterIndexForPosition(pos);
        };
        this.editor.translate = function (pos, n) {
            return _this.editor.fromIndex((_this.editor.toIndex(pos)) + n);
        };
        this.editor.fromCIRange = function (range) {
            var start = _this.editor.fromIndex(range.start);
            var end = _this.editor.fromIndex(range.end);
            return new Range(start, end);
        };
        this.disposables = new CompositeDisposable();
        this.panel = new Panel(this);
        this.process = new Process(this);
        this.textBuffer = new text_buffer_1.default(this);
        if (atom.config.get("agda-mode.inputMethod"))
            this.inputMethod = new input_method_1.default(this);
        this.highlightManager = new highlight_manager_1.default(this);
        this.atomPanel = atom.workspace.addBottomPanel({
            item: document.createElement("agda-panel"),
            visible: false,
            className: "agda-panel"
        });
        this.panel.$mount(this.atomPanel.item);
        this.panel.$on("jump-to-goal", function (index) {
            _this.textBuffer.jumpToGoal(parseInt(index.substr(1)));
        });
        this.panel.$on("jump-to-location", function (location) {
            _this.textBuffer.jumpToLocation(location);
        });
        this.panel.$on("select-key", function (key) {
            _this.inputMethod.insertChar(key);
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.panel.$on("select-symbol", function (symbol) {
            _this.inputMethod.insertSymbol(symbol);
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.panel.$on("replace-symbol", function (symbol) {
            _this.inputMethod.replaceString(symbol);
        });
        this.commander = new commander_1.default(this);
    }
    Core.prototype.getPath = function () {
        return parser_1.parseFilepath(this.editor.getPath());
    };
    Core.prototype.activate = function () {
        this.atomPanel.show();
    };
    Core.prototype.deactivate = function () {
        this.atomPanel.hide();
    };
    Core.prototype.destroy = function () {
        this.commander.quit();
        this.atomPanel.destroy();
        this.disposables.dispose();
    };
    return Core;
}());
exports.Core = Core;
