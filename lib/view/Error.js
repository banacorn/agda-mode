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
// Atom shits
var Error = (function (_super) {
    __extends(Error, _super);
    function Error() {
        _super.apply(this, arguments);
    }
    Error.prototype.render = function () {
        var error = this.props.children;
        var content = '';
        switch (error.kind) {
            case 'Unparsed': return (React.createElement("p", __assign({}, this.props), error.input));
        }
    };
    return Error;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
//# sourceMappingURL=Error.js.map