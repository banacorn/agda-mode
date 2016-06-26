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
var Error = (function (_super) {
    __extends(Error, _super);
    function Error() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(Error.prototype, "notInScope", {
        // computed
        get: function () { return this.error.errorType === "not in scope"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "typeMismatch", {
        get: function () { return this.error.errorType === "type mismatch"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "wrongConstructor", {
        get: function () { return this.error.errorType === "wrong constructor"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "applicationParseError", {
        get: function () { return this.error.errorType === "application parse error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "terminationError", {
        get: function () { return this.error.errorType === "termination error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "missingDefinition", {
        get: function () { return this.error.errorType === "missing definition"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "rhsOmitted", {
        get: function () { return this.error.errorType === "rhs omitted"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "parseError", {
        get: function () { return this.error.errorType === "parse error"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "unknown", {
        get: function () { return this.error.errorType === "unknown"; },
        enumerable: true,
        configurable: true
    });
    Error = __decorate([
        vue_class_component_1.default({
            props: {
                error: Object
            },
            template: "\n        <template v-if=\"notInScope\">\n            <li class=\"list-item\">\n                <span>Not in scope:</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n        </template>\n        <template v-if=\"typeMismatch\">\n            <li class=\"list-item\">\n                <span class=\"text-error\">Type mismatch:</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>expected:</span>\n                <type :input=\"error.expected\"></type>\n                <span>of type</span>\n                <type :input=\"error.type\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>  actual:</span>\n                <type :input=\"error.actual\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the expression</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"wrongConstructor\">\n            <li class=\"list-item\">\n                <span>The constructor</span>\n                <type :input=\"error.constructor\"></type>\n                <span>does not construct an element of</span>\n                <type :input=\"error.constructorType\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the expression</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"applicationParseError\">\n            <li class=\"list-item\">\n                <span>Could not parse the application</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n        </template>\n\n        <template v-if=\"terminationError\">\n            <li class=\"list-item\">\n                <span>Termination checking failed for the following functions:</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <type :input=\"error.expr\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>Problematic calls:</span>\n            </li>\n            <li class=\"list-item\" v-for=\"item in error.calls\">\n                <type :input=\"item.term\"></type>\n                <location :location=\"item.location\"></location>\n            </li>\n        </template>\n\n        <template v-if=\"missingDefinition\">\n            <li class=\"list-item\">\n                <span>Missing definition for</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n        </template>\n\n        <template v-if=\"rhsOmitted\">\n            <li class=\"list-item\">\n                <span>The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the clause</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.type\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"parseError\">\n            <li class=\"list-item\">\n                <span>Parse error:</span>\n                <span class=\"text-error\">{{error.expr}}</span>\n                <span>{{error.post}}</span>\n                <location :location=\"error.location\"></location>\n            </li>\n        </template>\n\n        <template v-if=\"unknown\">\n            <li class=\"list-item\">\n                <span>{{error.raw}}</span>\n            </li>\n        </template>"
        })
    ], Error);
    return Error;
}(Vue));
Vue.component("error", Error);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
