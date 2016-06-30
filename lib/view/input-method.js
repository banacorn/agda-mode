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
var _ = require("lodash");
var CompositeDisposable = require("atom").CompositeDisposable;
var InputMethod = (function (_super) {
    __extends(InputMethod, _super);
    function InputMethod() {
        _super.apply(this, arguments);
    }
    InputMethod.prototype.data = function () {
        return {
            suggestionKeys: [],
            candidateSymbols: [],
            rawInput: "",
            index: 0
        };
    };
    // lifecycle hook
    InputMethod.prototype.ready = function () {
        var _this = this;
        var commands = {
            "core:move-up": function (event) {
                if (!_.isEmpty(_this.candidateSymbols)) {
                    _this.moveUp();
                    _this.replaceSymbol(_this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-right": function (event) {
                if (!_.isEmpty(_this.candidateSymbols)) {
                    _this.moveRight();
                    _this.replaceSymbol(_this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-down": function (event) {
                if (!_.isEmpty(_this.candidateSymbols)) {
                    _this.moveDown();
                    _this.replaceSymbol(_this.selected[0]);
                    event.stopImmediatePropagation();
                }
            },
            "core:move-left": function (event) {
                if (!_.isEmpty(_this.candidateSymbols)) {
                    _this.moveLeft();
                    _this.replaceSymbol(_this.selected[0]);
                    event.stopImmediatePropagation();
                }
            }
        };
        this.subscriptions = atom.commands.add("atom-text-editor.agda-mode-input-method-activated", commands);
    };
    InputMethod.prototype.destroy = function () {
        this.subscriptions.destroy();
    };
    // methods
    InputMethod.prototype.selectKey = function (key) {
        this.$dispatch("select-key", key);
    };
    InputMethod.prototype.selectSymbol = function (symbol) {
        this.$dispatch("select-symbol", symbol);
    };
    InputMethod.prototype.replaceSymbol = function (symbol) {
        this.$dispatch("replace-symbol", symbol);
    };
    InputMethod.prototype.moveUp = function () {
        if (this.index - 10 >= 0)
            this.index -= 10;
    };
    InputMethod.prototype.moveDown = function () {
        if ((this.index + 10) < this.candidateSymbols.length)
            this.index += 10;
    };
    InputMethod.prototype.moveLeft = function () {
        if (this.index - 1 >= 0)
            this.index -= 1;
    };
    InputMethod.prototype.moveRight = function () {
        if ((this.index + 1) < this.candidateSymbols.length)
            this.index += 1;
    };
    InputMethod.prototype.row = function () {
        return Math.floor(this.index / 10);
    };
    InputMethod.prototype.col = function () {
        return this.index % 10;
    };
    Object.defineProperty(InputMethod.prototype, "input", {
        // computed
        set: function (input) {
            this.candidateSymbols = input.candidateSymbols;
            this.suggestionKeys = input.suggestionKeys;
            this.rawInput = input.rawInput;
            this.index = 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputMethod.prototype, "selectedLeft", {
        get: function () {
            var currentRow = _.take(_.drop(this.candidateSymbols, this.row() * 10), 10);
            return _.take(currentRow, this.col());
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputMethod.prototype, "selected", {
        get: function () {
            var currentRow = _.take(_.drop(this.candidateSymbols, this.row() * 10), 10);
            return _.compact(currentRow[this.col()]);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(InputMethod.prototype, "selectedRight", {
        get: function () {
            var currentRow = _.take(_.drop(this.candidateSymbols, this.row() * 10), 10);
            return _.drop(currentRow, this.col() + 1);
        },
        enumerable: true,
        configurable: true
    });
    InputMethod = __decorate([
        vue_class_component_1.default({
            props: {
                input: {
                    candidateSymbols: Array,
                    suggestionKeys: Array,
                    rawInput: Array,
                }
            },
            template: "\n        <div>\n            <div id=\"input-buffer-container\">\n                <div id=\"input-buffer\" class=\"inline-block\" v-show=\"rawInput\">{{rawInput}}</div>\n                <div id=\"suggestion-keys\" class=\"btn-group btn-group-sm\">\n                    <button class=\"btn\" v-for=\"key in suggestionKeys\" @click=\"selectKey(key)\">{{key}}</button>\n                </div>\n            </div>\n            <div id=\"candidate-symbols\" class=\"btn-group btn-group-sm\">\n                <button class=\"btn\" v-for=\"symbol in selectedLeft\" @click=\"selectSymbol(symbol)\">{{symbol}}</button>\n                <button class=\"btn selected\" v-for=\"symbol in selected\" @click=\"selectSymbol(symbol)\">{{symbol}}</button>\n                <button class=\"btn\" v-for=\"symbol in selectedRight\" @click=\"selectSymbol(symbol)\">{{symbol}}</button>\n            </div>\n        </div>\n        "
        })
    ], InputMethod);
    return InputMethod;
}(Vue));
Vue.component("agda-input-method", InputMethod);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = InputMethod;
