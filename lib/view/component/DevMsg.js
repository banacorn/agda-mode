"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
;
var DevMsg = (function (_super) {
    __extends(DevMsg, _super);
    function DevMsg() {
        _super.apply(this, arguments);
    }
    DevMsg.prototype.render = function () {
        var _a = this.props.message, kind = _a.kind, raw = _a.raw, processed = _a.processed;
        return (React.createElement("li", {className: kind}, raw));
    };
    return DevMsg;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DevMsg;
//# sourceMappingURL=DevMsg.js.map