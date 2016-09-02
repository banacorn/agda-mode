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
var react_redux_1 = require('react-redux');
var classNames = require('classnames');
var actions_1 = require('../actions');
var Expr_1 = require('./Expr');
var Error_1 = require('./Error');
var Location_1 = require('./Location');
var mapStateToProps = function (state) { return state.body; };
var mapDispatchToProps = function (dispatch) { return ({
    onMaxBodyHeightChange: function (count) {
        dispatch(actions_1.updateMaxBodyHeight(count));
    }
}); };
var Body = (function (_super) {
    __extends(Body, _super);
    function Body() {
        _super.apply(this, arguments);
    }
    Body.prototype.componentDidMount = function () {
        var _this = this;
        atom.config.observe('agda-mode.maxBodyHeight', function (newHeight) {
            _this.props.onMaxBodyHeightChange(newHeight - _this.props.maxBodyHeight);
        });
    };
    Body.prototype.render = function () {
        var _a = this.props, banner = _a.banner, body = _a.body, error = _a.error, plainText = _a.plainText, maxBodyHeight = _a.maxBodyHeight;
        var _b = this.props, jumpToGoal = _b.jumpToGoal, jumpToLocation = _b.jumpToLocation;
        var otherProps = _.omit(this.props, ['banner', 'body', 'error', 'plainText', 'maxBodyHeight', 'jumpToGoal', 'jumpToLocation', 'onMaxBodyHeightChange']);
        var classes = classNames(this.props.className, "native-key-bindings");
        var style = {
            maxHeight: maxBodyHeight + "px"
        };
        return (React.createElement("section", __assign({id: "agda-body", className: classes, tabIndex: "-1", style: style}, otherProps), 
            React.createElement("ul", {className: "list-group"}, banner.map(function (item, i) {
                return React.createElement("li", {className: "list-item banner-item", key: i}, 
                    React.createElement("span", null, 
                        React.createElement("span", {className: "text-info"}, item.label), 
                        " : "), 
                    React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, item.type));
            })), 
            React.createElement("ul", {className: "list-group"}, 
                body.goal.map(function (item, i) {
                    return React.createElement("li", {className: "list-item body-item", key: i}, 
                        React.createElement("div", {className: "item-heading"}, 
                            React.createElement("button", {className: "no-btn text-info", onClick: function () {
                                var index = parseInt(item.index.substr(1));
                                jumpToGoal(index);
                            }}, item.index), 
                            React.createElement("span", null, " : ")), 
                        React.createElement("div", {className: "item-body"}, 
                            React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, item.type)
                        ));
                }), 
                body.judgement.map(function (item, i) {
                    return React.createElement("li", {className: "list-item body-item", key: i}, 
                        React.createElement("div", {className: "item-heading"}, 
                            React.createElement("span", {className: "text-success"}, item.expr), 
                            React.createElement("span", null, " : ")), 
                        React.createElement("div", {className: "item-body"}, 
                            React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, item.type)
                        ));
                }), 
                body.term.map(function (item, i) {
                    return React.createElement("li", {className: "list-item body-item", key: i}, 
                        React.createElement("div", {className: "item-body"}, 
                            React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, item.expr)
                        )
                    );
                }), 
                body.meta.map(function (item, i) {
                    return React.createElement("li", {className: "list-item body-item", key: i}, 
                        React.createElement("div", {className: "item-heading"}, 
                            React.createElement("span", {className: "text-success"}, item.index), 
                            React.createElement("span", null, " : ")), 
                        React.createElement("div", {className: "item-body"}, 
                            React.createElement(Expr_1.default, {jumpToGoal: jumpToGoal}, item.type), 
                            React.createElement(Location_1.default, {jumpToLocation: jumpToLocation}, item.location)));
                }), 
                body.sort.map(function (item, i) {
                    return React.createElement("li", {className: "list-item body-item", key: i}, 
                        React.createElement("div", {className: "item-heading"}, 
                            React.createElement("span", {className: "text-highlight"}, "Sort "), 
                            React.createElement("span", {className: "text-warning"}, item.index)), 
                        React.createElement("div", {className: "item-body"}, 
                            React.createElement(Location_1.default, {jumpToLocation: jumpToLocation}, item.location)
                        ));
                })), 
            error ? React.createElement(Error_1.default, {jumpToGoal: jumpToGoal, jumpToLocation: jumpToLocation}, error) : null, 
            plainText ? React.createElement("p", null, plainText) : null));
    };
    return Body;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
//# sourceMappingURL=Body.js.map