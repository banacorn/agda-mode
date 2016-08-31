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
var Location = (function (_super) {
    __extends(Location, _super);
    function Location() {
        _super.apply(this, arguments);
    }
    Location.prototype.render = function () {
        var location = this.props.children;
        var result = "";
        if (location.path)
            result += location.path + ":";
        if (location.isSameLine)
            result += (location.range.start.row + 1) + "," + (location.range.start.column + 1) + "-" + (location.range.end.column + 1);
        else
            result += (location.range.start.row + 1) + "," + (location.range.start.column + 1) + "-" + (location.range.end.row + 1) + "," + (location.range.end.column + 1);
        return (React.createElement("span", __assign({className: "text-subtle location"}, this.props), result));
    };
    return Location;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Location;
//# sourceMappingURL=Location.js.map