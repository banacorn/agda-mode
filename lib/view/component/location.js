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
var Location = (function (_super) {
    __extends(Location, _super);
    function Location() {
        _super.apply(this, arguments);
    }
    // methods
    Location.prototype.jump = function (index) {
        this.$dispatch("jump-to-location", index);
    };
    Object.defineProperty(Location.prototype, "classes", {
        get: function () {
            var attr = this.$el.attributes.getNamedItem('no-float');
            if (attr)
                return "location no-float";
            else
                return "location";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Location.prototype, "isSameLine", {
        get: function () {
            return this.location.isSameLine;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Location.prototype, "notSameLine", {
        get: function () {
            return !this.location.isSameLine;
        },
        enumerable: true,
        configurable: true
    });
    Location = __decorate([
        vue_class_component_1.default({
            props: {
                location: Object
            },
            template: "<span class=\"{{classes}} text-subtle\" @click=\"jump(location)\"><template v-if=\"location.path\">{{location.path}}:</template><template v-if=\"isSameLine\">{{location.range.start.row + 1}},{{location.range.start.column + 1}}-{{location.range.end.column + 1}}</template><template v-if=\"notSameLine\">{{location.range.start.row + 1}},{{location.range.start.column + 1}}-{{location.range.end.row + 1}},{{location.range.end.column + 1}}</template></span>"
        })
    ], Location);
    return Location;
}(Vue));
Vue.component("location", Location);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Location;
//# sourceMappingURL=location.js.map