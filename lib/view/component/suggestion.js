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
var _ = require("lodash");
;
var vue_class_component_1 = require("vue-class-component");
var Vue = require("vue");
// did you mean: ℕ.succ         -- head
//            or succ           -- middle
//            or suc ?          -- last
var Suggestion = (function (_super) {
    __extends(Suggestion, _super);
    function Suggestion() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(Suggestion.prototype, "notEmpty", {
        // computed
        get: function () {
            return this.input.length !== 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Suggestion.prototype, "singleLine", {
        get: function () {
            return this.input.length === 1;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Suggestion.prototype, "head", {
        get: function () {
            return [_.head(this.input)];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Suggestion.prototype, "middle", {
        get: function () {
            return _.initial(_.tail(this.input));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Suggestion.prototype, "last", {
        get: function () {
            return [_.last(this.input)];
        },
        enumerable: true,
        configurable: true
    });
    Suggestion = __decorate([
        vue_class_component_1.default({
            props: {
                input: Array
            },
            template: "\n<template v-if=\"notEmpty\">\n    <template v-if=\"singleLine\">\n        <li class=\"list-item\">Did you mean: {{input[0]}} ?</li>\n    </template>\n    <template v-else>\n        <li class=\"list-item\" v-for=\"item in head\"><span>Did you mean: </span><type :input=\"item\"></type></li>\n        <li class=\"list-item\" v-for=\"item in middle\"><span>           or </span><type :input=\"item\"></type></li>\n        <li class=\"list-item\" v-for=\"item in last\"><span>           or </span><type :input=\"item\"></type><span> ?</span></li>\n    </template>\n</template>\n"
        })
    ], Suggestion);
    return Suggestion;
}(Vue));
Vue.component("suggestion", Suggestion);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Suggestion;
//# sourceMappingURL=suggestion.js.map