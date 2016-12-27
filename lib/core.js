"use strict";
var _a = require('atom'), Range = _a.Range, CompositeDisposable = _a.CompositeDisposable;
var parser_1 = require("./parser");
// # Components
var commander_1 = require("./commander");
var process_1 = require("./process");
var text_buffer_1 = require("./text-buffer");
var input_method_1 = require("./input-method");
var highlight_manager_1 = require("./highlight-manager");
var view_1 = require("./view");
var Action = require("./view/actions");
var Core = (function () {
    function Core(editor) {
        var _this = this;
        this.editor = editor;
        // helper methods on this.editor
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
        // initialize all components
        this.disposables = new CompositeDisposable();
        // view
        this.view = new view_1.default(this);
        this.process = new process_1.default(this);
        this.textBuffer = new text_buffer_1.default(this);
        if (atom.config.get('agda-mode.inputMethod'))
            this.inputMethod = new input_method_1.default(this);
        this.highlightManager = new highlight_manager_1.default(this);
        this.commander = new commander_1.default(this);
        // dispatch config related data to the store on initialization
        this.view.store.dispatch(Action.updateMaxBodyHeight(atom.config.get('agda-mode.maxBodyHeight')));
    }
    // shorthand for getting the path of the binded file
    Core.prototype.getPath = function () {
        return parser_1.parseFilepath(this.editor.getPath());
    };
    // Editor Events
    Core.prototype.activate = function () {
        this.view.activate();
    };
    Core.prototype.deactivate = function () {
        this.view.deactivate();
    };
    Core.prototype.destroy = function () {
        this.commander.quit();
        this.view.destroy();
        this.disposables.dispose();
    };
    return Core;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Core;
//# sourceMappingURL=core.js.map