"use strict";
const React = require("react");
;
class Message extends React.Component {
    render() {
        const { kind, raw, parsed } = this.props.message;
        if (kind === 'response') {
            return (React.createElement("li", { className: `dev-message response` },
                React.createElement("div", { className: `dev-message-item raw` }, raw),
                React.createElement("div", { className: `dev-message-item parsed` }, parsed)));
        }
        else {
            return (React.createElement("li", { className: `dev-message request` },
                React.createElement("div", { className: `dev-message-item raw` }, raw)));
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
// {_.isEmpty(parsed)
//     ? null
//     : <div className={`dev-message parsed`}>[{parsed}]</div>}
exports.default = Message;
//# sourceMappingURL=Message.js.map