"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
        var lines = this.props.children;
        switch (lines.length) {
            case 0: return null;
            case 1: return React.createElement("p", null, 
                "Did you mean: ", 
                React.createElement(Expr_1.default, null, lines[0]), 
                " ?");
            default: return (React.createElement("p", null, 
                "Did you mean: ", 
                React.createElement(Expr_1.default, null, _.head(lines)), 
                _.tail(lines).map(function (line, i) { return ("\n        or" + React.createElement(Expr_1.default, null, line)); }), 
                " ?"));
        }
    };
    return Suggestion;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Suggestion;
//# sourceMappingURL=Suggestion.js.map