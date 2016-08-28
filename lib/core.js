"use strict";
var _a = require("atom"), Range = _a.Range, CompositeDisposable = _a.CompositeDisposable;
var parser_1 = require("./parser");
var commander_1 = require("./commander");
var process_1 = require("./process");
var text_buffer_1 = require("./text-buffer");
var input_method_1 = require("./input-method");
var highlight_manager_1 = require("./highlight-manager");
var view_legacy_1 = require("./view-legacy");
var view_1 = require("./view");
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
        var anchor = document.createElement("agda-view");
        anchor.id = "agda-view";
        var atomPanel = atom.workspace.addBottomPanel({
            item: anchor,
            visible: true,
            className: "agda-view"
        });
        this.disposables = new CompositeDisposable();
        this.store = view_1.default(this);
        this.view = new view_legacy_1.default;
        this.process = new process_1.default(this);
        this.textBuffer = new text_buffer_1.default(this);
        if (atom.config.get("agda-mode.inputMethod"))
            this.inputMethod = new input_method_1.default(this);
        this.highlightManager = new highlight_manager_1.default(this);
        this.atomPanel = atom.workspace.addBottomPanel({
            item: document.createElement("agda-view"),
            visible: false,
            className: "agda-view"
        });
        this.view.$mount(this.atomPanel.item);
        this.view.$on("jump-to-goal", function (index) {
            _this.textBuffer.jumpToGoal(parseInt(index.substr(1)));
        });
        this.view.$on("jump-to-location", function (location) {
            _this.textBuffer.jumpToLocation(location);
        });
        this.view.$on("select-key", function (key) {
            _this.inputMethod.insertCharToBufffer(key);
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.view.$on("select-symbol", function (symbol) {
            _this.inputMethod.replaceBuffer(symbol);
            _this.inputMethod.deactivate();
            atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
        });
        this.view.$on("replace-symbol", function (symbol) {
            _this.inputMethod.replaceBuffer(symbol);
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Core;
//# sourceMappingURL=core.js.map