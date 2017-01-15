"use strict";
const React = require("react");
const react_redux_1 = require("react-redux");
const Panel_1 = require("./Dev/Panel");
const Message_1 = require("./Dev/Message");
const mapStateToProps = (state) => {
    return {
        messages: state.dev.messages
    };
};
class Dev extends React.Component {
    render() {
        const { messages } = this.props;
        return (React.createElement("section", { className: "agda-dev-view" },
            React.createElement(Panel_1.default, null),
            React.createElement("ol", { className: "agda-dev-body" }, messages.map((msg, i) => React.createElement(Message_1.default, { key: i, message: msg })))));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(Dev);
//# sourceMappingURL=Dev.js.map