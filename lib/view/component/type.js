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
var Type = (function (_super) {
    __extends(Type, _super);
    function Type() {
        _super.apply(this, arguments);
    }
    // methods
    Type.prototype.jumpToGoal = function (index) {
        this.$dispatch("jump-to-goal", index);
    };
    Object.defineProperty(Type.prototype, "type", {
        get: function () {
            //                               1       2                3
            var tokens = this.input.split(/(\?\d+)|(\_[^\.]\S*)|Set (\_\S+)/g);
            var unmarked = tokens.filter(function (_, i) { return i % 4 === 0; });
            var goals = tokens.filter(function (_, i) { return i % 4 === 1; });
            var metas = tokens.filter(function (_, i) { return i % 4 === 2; });
            var sorts = tokens.filter(function (_, i) { return i % 4 === 3; });
            return unmarked.map(function (u, i) {
                return {
                    unmarked: u,
                    goal: goals[i],
                    meta: metas[i],
                    sort: sorts[i],
                };
            });
        },
        enumerable: true,
        configurable: true
    });
    Type = __decorate([
        vue_class_component_1.default({
            props: {
                input: String
            },
            template: "<div class=\"type\"><template v-for=\"item in type\"><span v-if=\"item.unmarked\" class=\"text-highlight\">{{item.unmarked}}</span><button v-if=\"item.goal\" class=\"no-btn text-info\" @click=\"jumpToGoal(item.goal)\">{{item.goal}}</button><span v-if=\"item.meta\" class=\"text-success\">{{item.meta}}</span><template v-if=\"item.sort\"><span class=\"text-highlight\">Set </span><span class=\"text-warning\">{{item.sort}}</span></template></template></div>"
        })
    ], Type);
    return Type;
}(Vue));
Vue.component("type", Type);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Type;
//# sourceMappingURL=type.js.map