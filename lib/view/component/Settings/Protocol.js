"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
;
class Message extends React.Component {
    render() {
        const { kind, raw, parsed } = this.props.message;
        if (kind === 'response') {
            return (React.createElement("li", { className: "protocol-message response" },
                React.createElement("div", { className: "protocol-message-item parsed" }, parsed)));
        }
        else {
            return (React.createElement("li", { className: "protocol-message request" },
                React.createElement("div", { className: "protocol-message-item raw" }, raw)));
        }
    }
}
function mapStateToProps(state) {
    return state.protocol;
}
class Protocol extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {
        //     tabIndex: 0
        // };
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        return (React.createElement("section", { className: this.props.className },
            React.createElement("p", null, "Current Protocol: Emacs-vanilla"),
            React.createElement("section", { className: "agda-settings-protocol-message-list" },
                React.createElement("ol", null, this.props.messages.map((msg, i) => React.createElement(Message, { message: msg, key: i }))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Protocol);
//# sourceMappingURL=Protocol.js.map