"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var vue_class_component_1 = require("vue-class-component");
var Vue = require("vue");
var Promise = require("bluebird");
var _ = require("lodash");
var error_1 = require("../error");
var parser_1 = require("../parser");
var CompositeDisposable = require("atom").CompositeDisposable;
var InputEditor = (function (_super) {
    __extends(InputEditor, _super);
    function InputEditor() {
        _super.apply(this, arguments);
    }
    InputEditor.prototype.data = function () {
        return {
            placeholderText: ""
        };
    };
    // lifecycle hook
    InputEditor.prototype.ready = function () {
        var _this = this;
        var confirmDisposable = atom.commands.add(this.$el, "core:confirm", function () {
            var expr = parser_1.parseInputContent(_this.$el.getModel().getText());
            _this.$emit("confirm", expr);
            _this.$dispatch("input-editor:confirm", expr);
        });
        var cancelDisposable = atom.commands.add(this.$el, "core:cancel", function () {
            _this.$emit("cancel");
            _this.$dispatch("input-editor:cancel");
        });
        this.subscriptions = new CompositeDisposable;
        this.subscriptions.add(confirmDisposable);
        this.subscriptions.add(cancelDisposable);
    };
    InputEditor.prototype.destroyed = function () {
        this.subscriptions.destroy();
    };
    // methods
    InputEditor.prototype.initialize = function (enableIM) {
        var _this = this;
        var textEditor = this.$el.getModel();
        // set grammar: agda to enable input method
        if (enableIM) {
            var agdaGrammar = atom.grammars.grammarForScopeName("source.agda");
            textEditor.setGrammar(agdaGrammar);
        }
        else {
            textEditor.setGrammar();
        }
        // reject old queries
        this.$dispatch("input-editor:cancel");
        // focus the input box (with setTimeout quirk)
        setTimeout(function () { _this.$el.focus(); });
        // set placeholder text
        textEditor.setPlaceholderText(this.placeholderText);
    };
    InputEditor.prototype.query = function (enableIM) {
        var _this = this;
        this.initialize(enableIM);
        return new Promise(function (resolve, reject) {
            _this.$once("confirm", function (expr) {
                resolve(expr);
            });
            _this.$once("cancel", function () {
                reject(new error_1.QueryCancelledError("query cancelled"));
            });
        });
    };
    InputEditor.prototype.isFocused = function () {
        return _.includes(this.$el.classList, "is-focused");
    };
    InputEditor = __decorate([
        vue_class_component_1.default({
            template: "<atom-text-editor mini></atom-text-editor>"
        })
    ], InputEditor);
    return InputEditor;
}(Vue));
Vue.component("agda-input-editor", InputEditor);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputEditor;
