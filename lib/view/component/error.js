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
require("./suggestion");
var Error = (function (_super) {
    __extends(Error, _super);
    function Error() {
        _super.apply(this, arguments);
    }
    Object.defineProperty(Error.prototype, "notInScope", {
        // computed
        get: function () { return this.error.kind === "NotInScope"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "typeMismatch", {
        get: function () { return this.error.kind === "TypeMismatch"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "definitionTypeMismatch", {
        get: function () { return this.error.kind === "DefinitionTypeMismatch"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "badConstructor", {
        get: function () { return this.error.kind === "BadConstructor"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "rhsOmitted", {
        get: function () { return this.error.kind === "RHSOmitted"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "missingType", {
        get: function () { return this.error.kind === "MissingType"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "multipleDefinition", {
        get: function () { return this.error.kind === "MultipleDefinition"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "missingDefinition", {
        get: function () { return this.error.kind === "MissingDefinition"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "termination", {
        get: function () { return this.error.kind === "Termination"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "constructorTarget", {
        get: function () { return this.error.kind === "ConstructorTarget"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "functionType", {
        get: function () { return this.error.kind === "FunctionType"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "moduleMismatch", {
        get: function () { return this.error.kind === "ModuleMismatch"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "parse", {
        get: function () { return this.error.kind === "Parse"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "caseSingleHole", {
        get: function () { return this.error.kind === "CaseSingleHole"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "patternMatchOnNonDatatype", {
        get: function () { return this.error.kind === "PatternMatchOnNonDatatype"; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Error.prototype, "unparsed", {
        // get applicationParseError(): boolean { return this.error.kind === "ApplicationParseError"; }
        get: function () { return this.error.kind === "Unparsed"; },
        enumerable: true,
        configurable: true
    });
    Error = __decorate([
        vue_class_component_1.default({
            props: {
                error: Object
            },
            template: "\n        <template v-if=\"notInScope\">\n            <li class=\"list-item\">\n                <span>Not in scope:</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n            <suggestion :input=\"error.suggestion\"></suggestion>\n        </template>\n\n        <template v-if=\"typeMismatch\">\n            <li class=\"list-item\">\n                <span class=\"text-error\">Type mismatch:</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>expected:</span>\n                <type :input=\"error.expected\"></type>\n                <span>of type</span>\n                <type :input=\"error.expectedType\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>  actual:</span>\n                <type :input=\"error.actual\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the expression</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"definitionTypeMismatch\">\n            <li class=\"list-item\">\n                <span class=\"text-error\">Type mismatch:</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>expected:</span>\n                <type :input=\"error.expected\"></type>\n                <span>of type</span>\n                <type :input=\"error.expectedType\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>  actual:</span>\n                <type :input=\"error.actual\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking the definition of</span>\n                <type :input=\"error.expr\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"badConstructor\">\n            <li class=\"list-item\">\n                <span>The constructor</span>\n                <type :input=\"error.constructor\"></type>\n                <span>does not construct an element of</span>\n                <type :input=\"error.constructorType\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the expression</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"rhsOmitted\">\n            <li class=\"list-item\">\n                <span>The right-hand side can only be omitted if there is an absurd pattern, () or {}, in the left-hand side.</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the clause</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"missingType\">\n            <li class=\"list-item\">\n                <span>Missing type signature for left hand side</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when scope checking the declaration</span>\n                <type :input=\"error.expr\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"multipleDefinition\">\n            <li class=\"list-item\">\n                <span>Multiple definitions of</span>\n                <type :input=\"error.decl\"></type><span> : </span><type :input=\"error.declType\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n                <li class=\"list-item\">\n                    <span>Previous definition:</span>\n                    <type :input=\"error.expr\"></type>\n                    <location :location=\"error.locationPrev\"></location>\n                </li>\n        </template>\n\n        <template v-if=\"missingDefinition\">\n            <li class=\"list-item\">\n                <span>Missing definition for</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n        </template>\n\n        <template v-if=\"termination\">\n            <li class=\"list-item\">\n                <span>Termination checking failed for the following functions:</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>  </span><type :input=\"error.expr\"></type>\n            </li>\n            <li class=\"list-item\">\n                <span>Problematic calls:</span>\n            </li>\n            <li class=\"list-item\" v-for=\"item in error.calls\">\n                <span>  </span><type :input=\"item.expr\"></type>\n                <location :location=\"item.location\"></location>\n            </li>\n        </template>\n\n        <template v-if=\"constructorTarget\">\n            <li class=\"list-item\">\n                <span>The target of a constructor must be the datatype applied to its parameters,</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <type :input=\"error.expr\"></type>\n                <span>isn't</span>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking the constructor</span>\n                <type :input=\"error.ctor\"></type>\n                <span>in the declaration of</span>\n                <type :input=\"error.decl\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"functionType\">\n            <li class=\"list-item\">\n                <type :input=\"error.expr\"></type>\n                <span>should be a function type, but it isn't</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that</span>\n                <type :input=\"error.expr\"></type>\n                <span>is a valid argument to a function of type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"moduleMismatch\">\n            <li class=\"list-item\">\n                <span>You tried to load</span>\n                <span>{{error.wrongPath}}</span>\n                <span>which defines</span>\n            </li>\n            <li class=\"list-item\">\n                <span>the module</span>\n                <span>{{error.moduleName}}</span>\n                <span>. However, according to the include path this module</span>\n            </li>\n            <li class=\"list-item\">\n                <span>should be defined in</span>\n                <span>{{error.rightPath}}</span>\n            </li>\n        </template>\n\n\n        <template v-if=\"parse\">\n            <li class=\"list-item\">\n                <span class=\"text-error\">{{error.message}}</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>{{error.expr}}</span>\n            </li>\n        </template>\n\n        <template v-if=\"caseSingleHole\">\n            <li class=\"list-item\">\n                <span>Right hand side must be a single hole when making a case distinction</span>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the expression</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"patternMatchOnNonDatatype\">\n            <li class=\"list-item\">\n                <span>Cannot pattern match on non-datatype</span>\n                <type :input=\"error.nonDatatype\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n            <li class=\"list-item\">\n                <span>when checking that the expression</span>\n                <type :input=\"error.expr\"></type>\n                <span>has type</span>\n                <type :input=\"error.exprType\"></type>\n            </li>\n        </template>\n\n        <template v-if=\"applicationParseError\">\n            <li class=\"list-item\">\n                <span>Could not parse the application</span>\n                <type :input=\"error.expr\"></type>\n                <location :location=\"error.location\"></location>\n            </li>\n        </template>\n\n\n        <template v-if=\"unparsed\">\n            <li class=\"list-item\">\n                <span>{{error.input}}</span>\n            </li>\n        </template>"
        })
    ], Error);
    return Error;
}(Vue));
Vue.component("error", Error);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
