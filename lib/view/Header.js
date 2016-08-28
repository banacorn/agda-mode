"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
function toHeaderStyle(type) {
    switch (type) {
        case 1 /* Error */: return 'error';
        case 2 /* Warning */: return 'warning';
        case 3 /* Judgement */: return 'info';
        case 4 /* Value */: return 'success';
        case 0 /* PlainText */: return 'plain-text';
        default: return '';
    }
}
var mapStateToProps = function (state) {
    return state.header;
};
var Header = (function (_super) {
    __extends(Header, _super);
    function Header() {
        _super.apply(this, arguments);
    }
    Header.prototype.render = function () {
        var _a = this.props, text = _a.text, style = _a.style;
        return (React.createElement("h1", null, text));
    };
    return Header;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(Header);
//# sourceMappingURL=Header.js.map