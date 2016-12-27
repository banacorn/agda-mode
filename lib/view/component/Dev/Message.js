"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
;
var Message = (function (_super) {
    __extends(Message, _super);
    function Message() {
        return _super.apply(this, arguments) || this;
    }
    Message.prototype.render = function () {
        var _a = this.props.message, kind = _a.kind, raw = _a.raw, parsed = _a.parsed;
        if (kind === 'response') {
            return (React.createElement("li", { className: "dev-message response" },
                React.createElement("div", { className: "dev-message-item raw" }, raw),
                React.createElement("div", { className: "dev-message-item parsed" }, parsed)));
        }
        else {
            return (React.createElement("li", { className: "dev-message request" },
                React.createElement("div", { className: "dev-message-item raw" }, raw)));
        }
    };
    return Message;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
// {_.isEmpty(parsed)
//     ? null
//     : <div className={`dev-message parsed`}>[{parsed}]</div>}
exports.default = Message;
//# sourceMappingURL=Message.js.map