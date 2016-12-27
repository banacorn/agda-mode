"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var react_redux_1 = require("react-redux");
var _ = require("lodash");
var classNames = require("classnames");
var Settings_1 = require("./Settings");
function toStyle(type) {
    switch (type) {
        case 3 /* Error */: return 'error';
        case 4 /* Warning */: return 'warning';
        case 1 /* Info */: return 'info';
        case 2 /* Success */: return 'success';
        case 0 /* PlainText */: return 'plain-text';
        default: return '';
    }
}
var mapStateToProps = function (state) {
    return {
        text: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated
    };
};
var Header = (function (_super) {
    __extends(Header, _super);
    function Header() {
        return _super.apply(this, arguments) || this;
    }
    Header.prototype.render = function () {
        var _a = this.props, text = _a.text, style = _a.style, inputMethodActivated = _a.inputMethodActivated;
        var _b = this.props, mountAtPane = _b.mountAtPane, mountAtBottom = _b.mountAtBottom, toggleDevView = _b.toggleDevView;
        var classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, 'agda-header');
        return (React.createElement("div", { className: classes },
            React.createElement("h1", { className: "text-" + toStyle(style) }, text),
            React.createElement(Settings_1.default, { mountAtPane: mountAtPane, mountAtBottom: mountAtBottom, toggleDevView: toggleDevView })));
    };
    return Header;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(Header);
//# sourceMappingURL=Header.js.map