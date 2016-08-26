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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
    InputEditor.prototype.initialize = function (enableIM) {
        var textEditor = this.$el.getModel();
        if (enableIM) {
            var agdaGrammar = atom.grammars.grammarForScopeName("source.agda");
            textEditor.setGrammar(agdaGrammar);
        }
        else {
            textEditor.setGrammar();
        }
        this.$dispatch("input-editor:cancel");
        this.focus();
        this.select();
        textEditor.setPlaceholderText(this.placeholderText);
    };
    InputEditor.prototype.query = function (enableIM, placeholder) {
        var _this = this;
        this.placeholderText = placeholder;
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
    InputEditor.prototype.focus = function () {
        var _this = this;
        setTimeout(function () { _this.$el.focus(); });
    };
    InputEditor.prototype.select = function () {
        this.$el.getModel().selectAll();
    };
    InputEditor.prototype.isFocused = function () {
        return _.includes(this.$el.classList, "is-focused");
    };
    InputEditor = __decorate([
        vue_class_component_1.default({
            template: "<atom-text-editor mini placeholder-text=\"placeholderText\"></atom-text-editor>"
        }), 
        __metadata('design:paramtypes', [])
    ], InputEditor);
    return InputEditor;
}(Vue));
Vue.component("agda-input-editor", InputEditor);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputEditor;
//# sourceMappingURL=input-editor.js.map