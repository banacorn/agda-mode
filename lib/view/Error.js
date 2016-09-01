"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var util_1 = require('util');
var Expr_1 = require('./Expr');
var Location_1 = require('./Location');
var Error = (function (_super) {
    __extends(Error, _super);
    function Error() {
        _super.apply(this, arguments);
    }
    Error.prototype.render = function () {
        var error = this.props.children;
        var _a = this.props, jumpToGoal = _a.jumpToGoal, jumpToLocation = _a.jumpToLocation;
        var content = '';
        switch (error.kind) {
            case 'BadConstructor': return React.createElement("p", {className: "error"}, 
                React.createElement(Location_1.default, {jumpToLocation: jumpToLocation}, error.location), 
                React.createElement("br", null), 
                "The constructor ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, error.constructor), 
                React.createElement("br", null), 
                "does not construct an element of ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, error.constructorType), 
                React.createElement("br", null), 
                "when checking that the expression ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, error.expr), 
                React.createElement("br", null), 
                "has type ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, error.exprType));
            case 'CaseSingleHole': return React.createElement("p", {className: "error"}, 
                React.createElement(Location_1.default, {jumpToLocation: jumpToLocation}, error.location), 
                React.createElement("br", null), 
                "Right hand side must be a single hole when making a case distinction", 
                React.createElement("br", null), 
                "when checking that the expression ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, error.expr), 
                React.createElement("br", null), 
                "has type ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, error.exprType), 
                React.createElement("br", null));
            case 'Unparsed': return React.createElement("p", {className: "error"}, error.input);
            default: return React.createElement("p", {className: "error"}, util_1.inspect(error, false, null));
        }
    };
    return Error;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
//# sourceMappingURL=Error.js.map