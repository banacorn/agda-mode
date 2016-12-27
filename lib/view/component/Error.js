"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var util_1 = require("util");
var Expr_1 = require("./Expr");
var Location_1 = require("./Location");
var Suggestion_1 = require("./Suggestion");
var Error = (function (_super) {
    __extends(Error, _super);
    function Error() {
        return _super.apply(this, arguments) || this;
    }
    Error.prototype.render = function () {
        var emitter = this.props.emitter;
        var error = this.props.children;
        var content = '';
        switch (error.kind) {
            case 'BadConstructor': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "The constructor ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.constructor),
                React.createElement("br", null),
                "does not construct an element of ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.constructorType),
                React.createElement("br", null),
                "when checking that the expression ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType));
            case 'CaseSingleHole': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Right hand side must be a single hole when making a case distinction",
                React.createElement("br", null),
                "when checking that the expression ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType),
                React.createElement("br", null));
            case 'ConstructorTarget': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "The target of a constructor must be the datatype applied to its parameters, ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                " isn't",
                React.createElement("br", null),
                "when checking the constructor ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.ctor),
                React.createElement("br", null),
                "in the declaration of ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.decl),
                React.createElement("br", null));
            case 'DefinitionTypeMismatch': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Type mismatch:",
                React.createElement("br", null),
                "expected: ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expected),
                " of type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expectedType),
                React.createElement("br", null),
                React.createElement("span", null, "  "),
                "actual: ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.actual),
                React.createElement("br", null),
                "when checking the definition of ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr));
            case 'FunctionType': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                " should be a function type, but it isn't",
                React.createElement("br", null),
                "when checking that ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                " is a valid argument to a function of type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType),
                React.createElement("br", null));
            case 'IlltypedPattern': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Type mismatch when checking that the pattern ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.pattern),
                " has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.type));
            case 'LibraryNotFound': return React.createElement("div", { className: "error" }, error.libraries.map(function (library, i) { return React.createElement("div", { key: i },
                "Library '",
                library.name,
                "' not found.",
                React.createElement("br", null),
                "Add the path to its .agda-lib file to",
                React.createElement("br", null),
                React.createElement("span", null, "    "),
                library.agdaLibFilePath,
                React.createElement("br", null),
                "to install.",
                React.createElement("br", null),
                "Installed libraries:",
                React.createElement("br", null),
                React.createElement("ul", null, library.installedLibraries.length ?
                    library.installedLibraries.map(function (installed, j) { return React.createElement("li", { key: j },
                        installed.name,
                        ": ",
                        installed.path); })
                    : React.createElement("li", null, "(none)"))); }));
            case 'MissingDefinition': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Missing definition for ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr));
            case 'MissingType': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Missing type signature for left hand side ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "when scope checking the declaration ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.decl));
            case 'MultipleDefinition': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Multiple definitions of ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "Previous definition at ",
                React.createElement(Location_1.default, { emitter: emitter }, error.locationPrev),
                React.createElement("br", null),
                "when scope checking the declaration",
                React.createElement("br", null),
                React.createElement(Expr_1.default, { emitter: emitter }, error.decl),
                " : ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.declType));
            case 'NotInScope': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Not in scope: ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                React.createElement(Suggestion_1.default, { emitter: emitter }, error.suggestion));
            case 'Parse': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                React.createElement("span", { className: "text-error" }, error.message),
                React.createElement("br", null),
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr));
            case 'PatternMatchOnNonDatatype': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                React.createElement(Expr_1.default, { emitter: emitter }, error.nonDatatype),
                " has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType),
                React.createElement("br", null),
                "when checking that the expression ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType));
            case 'RHSOmitted': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "The right-hand side can only be omitted if there is an absurd pattern, () or ",
                ", in the left-hand side.",
                React.createElement("br", null),
                "when checking that the expression ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType));
            case 'Termination': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Termination checking failed for the following functions:",
                React.createElement("br", null),
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "Problematic calls:",
                React.createElement("br", null),
                error.calls.map(function (call, i) { return React.createElement("span", { key: i },
                    React.createElement(Expr_1.default, { emitter: emitter }, call.expr),
                    React.createElement("br", null),
                    React.createElement(Location_1.default, { emitter: emitter }, call.location)); }));
            case 'TypeMismatch': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                "Type mismatch:",
                React.createElement("br", null),
                "expected: ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expected),
                React.createElement("br", null),
                React.createElement("span", null, "  "),
                "actual: ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.actual),
                React.createElement("br", null),
                "when checking that the expression ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.expr),
                React.createElement("br", null),
                "has type ",
                React.createElement(Expr_1.default, { emitter: emitter }, error.exprType));
            case 'UnparsedButLocated': return React.createElement("p", { className: "error" },
                React.createElement(Location_1.default, { emitter: emitter }, error.location),
                React.createElement("br", null),
                error.input);
            case 'Unparsed': return React.createElement("p", { className: "error" }, error.input);
            default: return React.createElement("p", { className: "error" }, util_1.inspect(error, false, null));
        }
    };
    return Error;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
//# sourceMappingURL=Error.js.map