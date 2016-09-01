"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var _ = require('lodash');
var React = require('react');
var Expr_1 = require('./Expr');
var Suggestion = (function (_super) {
    __extends(Suggestion, _super);
    function Suggestion() {
        _super.apply(this, arguments);
    }
    Suggestion.prototype.render = function () {
        var jumpToGoal = this.props.jumpToGoal;
        var lines = this.props.children;
        switch (lines.length) {
            case 0: return null;
            case 1: return React.createElement("p", __assign({}, this.props), 
                "Did you mean: ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, lines[0]), 
                " ?");
            default: return (React.createElement("p", __assign({}, this.props), 
                "Did you mean: ", 
                React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, _.head(lines)), 
                _.tail(lines).map(function (line, i) { return ("\n        or" + React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, line)); }), 
                " ?"));
        }
    };
    return Suggestion;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Suggestion;
//# sourceMappingURL=Suggestion.js.map