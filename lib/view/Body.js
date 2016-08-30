"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var Error_1 = require('./Error');
var mapStateToProps = function (state) { return state.body; };
var Body = (function (_super) {
    __extends(Body, _super);
    function Body() {
        _super.apply(this, arguments);
    }
    Body.prototype.render = function () {
        var _a = this.props, banner = _a.banner, body = _a.body, error = _a.error, plainText = _a.plainText;
        return (React.createElement("section", null, 
            React.createElement("ul", {className: "list-group"}, banner.map(function (item, i) {
                return React.createElement("li", {className: "list-item", key: i}, 
                    React.createElement("span", {className: "text-info"}, item.label), 
                    React.createElement("span", null, ":"));
            })), 
            React.createElement("ul", {className: "list-group"}, 
                body.goal.map(function (item, i) {
                    return React.createElement("li", {className: "list-item", key: i}, 
                        React.createElement("button", {className: "no-btn text-info"}, item.index), 
                        React.createElement("span", null, ":"));
                }), 
                body.judgement.map(function (item, i) {
                    return React.createElement("li", {className: "list-item", key: i}, 
                        React.createElement("span", {className: "text-success"}, item.expr), 
                        React.createElement("span", null, ":"));
                }), 
                body.term.map(function (item, i) {
                    return React.createElement("li", {className: "list-item", key: i});
                }), 
                body.meta.map(function (item, i) {
                    return React.createElement("li", {className: "list-item", key: i}, 
                        React.createElement("span", {className: "text-success"}, item.index), 
                        React.createElement("span", null, ":"));
                }), 
                body.sort.map(function (item, i) {
                    return React.createElement("li", {className: "list-item", key: i}, 
                        React.createElement("span", {className: "text-highlight"}, "Sort"), 
                        React.createElement("span", {className: "text-warning"}, item.index));
                })), 
            React.createElement("ul", {className: "list-group"}, error ? React.createElement(Error_1.default, {error: error}) : null), 
            React.createElement("ul", {className: "list-group"}, plainText.map(function (item, i) {
                return React.createElement("li", {className: "list-item", key: i}, 
                    React.createElement("span", null, plainText)
                );
            }))));
    };
    return Body;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(Body);
//# sourceMappingURL=Body.js.map