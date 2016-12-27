"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var react_redux_1 = require("react-redux");
var classNames = require("classnames");
var actions_1 = require("../actions");
var Expr_1 = require("./Expr");
var Error_1 = require("./Error");
var Location_1 = require("./Location");
var mapStateToProps = function (state) {
    var obj = state.body;
    obj['mountAtBottom'] = state.view.mountAt.current === 1 /* Bottom */;
    return obj;
};
var mapDispatchToProps = function (dispatch) { return ({
    onMaxBodyHeightChange: function (count) {
        dispatch(actions_1.updateMaxBodyHeight(count));
    }
}); };
var Body = (function (_super) {
    __extends(Body, _super);
    function Body() {
        return _super.apply(this, arguments) || this;
    }
    Body.prototype.componentDidMount = function () {
        var _this = this;
        atom.config.observe('agda-mode.maxBodyHeight', function (newHeight) {
            _this.props.onMaxBodyHeightChange(newHeight);
        });
    };
    Body.prototype.render = function () {
        var _a = this.props, emitter = _a.emitter, banner = _a.banner, body = _a.body, error = _a.error, plainText = _a.plainText, maxBodyHeight = _a.maxBodyHeight, mountAtBottom = _a.mountAtBottom;
        var classes = classNames(this.props.className, "native-key-bindings", 'agda-body');
        var style = mountAtBottom ? {
            maxHeight: maxBodyHeight + "px"
        } : {};
        return (React.createElement("section", { className: classes, tabIndex: -1, style: style },
            React.createElement("ul", { className: "list-group" }, banner.map(function (item, i) {
                return React.createElement("li", { className: "list-item banner-item", key: i },
                    React.createElement("div", { className: "item-heading text-info" }, item.label),
                    React.createElement("div", { className: "item-colon" },
                        React.createElement("span", null, " : ")),
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Expr_1.default, { emitter: emitter }, item.type)));
            })),
            React.createElement("ul", { className: "list-group" },
                body.goal.map(function (item, i) {
                    return React.createElement("li", { className: "list-item body-item", key: i },
                        React.createElement("div", { className: "item-heading" },
                            React.createElement("button", { className: "no-btn text-info", onClick: function () {
                                    var index = parseInt(item.index.substr(1));
                                    emitter.emit(actions_1.EVENT.JUMP_TO_GOAL, index);
                                } }, item.index)),
                        React.createElement("div", { className: "item-colon" },
                            React.createElement("span", null, " : ")),
                        React.createElement("div", { className: "item-body" },
                            React.createElement(Expr_1.default, { emitter: emitter }, item.type)));
                }),
                body.judgement.map(function (item, i) {
                    return React.createElement("li", { className: "list-item body-item", key: i },
                        React.createElement("div", { className: "item-heading" },
                            React.createElement("span", { className: "text-success" }, item.expr)),
                        React.createElement("div", { className: "item-colon" },
                            React.createElement("span", null, " : ")),
                        React.createElement("div", { className: "item-body" },
                            React.createElement(Expr_1.default, { emitter: emitter }, item.type)));
                }),
                body.term.map(function (item, i) {
                    return React.createElement("li", { className: "list-item body-item", key: i },
                        React.createElement("div", { className: "item-body" },
                            React.createElement(Expr_1.default, { emitter: emitter }, item.expr)));
                }),
                body.meta.map(function (item, i) {
                    return React.createElement("li", { className: "list-item body-item", key: i },
                        React.createElement("div", { className: "item-heading" },
                            React.createElement("span", { className: "text-success" }, item.index)),
                        React.createElement("div", { className: "item-colon" },
                            React.createElement("span", null, " : ")),
                        React.createElement("div", { className: "item-body" },
                            React.createElement(Expr_1.default, { emitter: emitter }, item.type),
                            React.createElement(Location_1.default, { abbr: true, emitter: emitter }, item.location)));
                }),
                body.sort.map(function (item, i) {
                    return React.createElement("li", { className: "list-item body-item", key: i },
                        React.createElement("div", { className: "item-heading" },
                            React.createElement("span", { className: "text-highlight" }, "Sort "),
                            React.createElement("span", { className: "text-warning" }, item.index)),
                        React.createElement("div", { className: "item-body" },
                            React.createElement(Location_1.default, { abbr: true, emitter: emitter }, item.location)));
                })),
            error ? React.createElement(Error_1.default, { emitter: emitter }, error) : null,
            plainText ? React.createElement("p", null, plainText) : null));
    };
    return Body;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
//# sourceMappingURL=Body.js.map