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
var React = require('react');
var _ = require('lodash');
;
var Header = (function (_super) {
    __extends(Header, _super);
    function Header() {
        _super.apply(this, arguments);
    }
    Header.prototype.render = function () {
        var _a = this.props, level = _a.level, children = _a.children;
        var otherProps = _.omit(this.props, 'level', 'children');
        switch (level) {
            case 1: return React.createElement("h1", __assign({}, otherProps), children);
            case 2: return React.createElement("h2", __assign({}, otherProps), children);
            case 3: return React.createElement("h3", __assign({}, otherProps), children);
            case 4: return React.createElement("h4", __assign({}, otherProps), children);
            case 5: return React.createElement("h5", __assign({}, otherProps), children);
            case 6: return React.createElement("h6", __assign({}, otherProps), children);
            default:
                return React.createElement("h1", __assign({}, otherProps), children);
        }
    };
    return Header;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Header;
//# sourceMappingURL=test.js.map