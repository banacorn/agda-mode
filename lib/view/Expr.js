"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var Term = (function (_super) {
    __extends(Term, _super);
    function Term() {
        _super.apply(this, arguments);
    }
    Term.prototype.render = function () {
        switch (this.props.kind) {
            case 'unmarked': return React.createElement("span", {className: "text-highlight"}, this.props.children);
            case 'goal': return React.createElement("button", {className: "no-btn text-info"}, this.props.children);
            case 'meta': return React.createElement("span", {className: "text-highlight"}, this.props.children);
            case 'sort': return React.createElement("span", {className: "text-highlight"}, this.props.children);
        }
    };
    return Term;
}(React.Component));
var Expr = (function (_super) {
    __extends(Expr, _super);
    function Expr() {
        _super.apply(this, arguments);
    }
    Expr.prototype.render = function () {
        var expressions;
        if (typeof this.props.children === 'string') {
            //                                         1       2                3
            var tokens = this.props.children.split(/(\?\d+)|(\_[^\.]\S*)|Set (\_\S+)/g);
            expressions = tokens.map(function (token, i) {
                switch (i % 4) {
                    case 0: return {
                        kind: 'unmarked',
                        payload: token
                    };
                    case 1: return {
                        kind: 'goal',
                        payload: token
                    };
                    case 2: return {
                        kind: 'meta',
                        payload: token
                    };
                    case 3: return {
                        kind: 'sort',
                        payload: token
                    };
                }
            }).filter(function (token) { return !_.isEmpty(token.payload); });
        }
        else {
            expressions = [];
        }
        return (React.createElement("span", {className: "type"}, expressions.map(function (expr, i) {
            return React.createElement(Term, {kind: expr.kind, key: i}, expr.payload);
        })));
    };
    return Expr;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Expr;
//# sourceMappingURL=Expr.js.map