"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var react_redux_1 = require("react-redux");
var Panel_1 = require("./Dev/Panel");
var Message_1 = require("./Dev/Message");
var mapStateToProps = function (state) {
    return {
        messages: state.dev.messages
    };
};
var Dev = (function (_super) {
    __extends(Dev, _super);
    function Dev() {
        return _super.apply(this, arguments) || this;
    }
    Dev.prototype.render = function () {
        var messages = this.props.messages;
        return (React.createElement("section", { className: "agda-dev-view" },
            React.createElement(Panel_1.default, null),
            React.createElement("ol", { className: "agda-dev-body" }, messages.map(function (msg, i) {
                return React.createElement(Message_1.default, { key: i, message: msg });
            }))));
    };
    return Dev;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(Dev);
//# sourceMappingURL=Dev.js.map