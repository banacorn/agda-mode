"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Panel_1 = require("./Dev/Panel");
const Message_1 = require("./Dev/Message");
const mapStateToProps = (state) => {
    return {
        messages: state.dev.messages,
        lsp: state.dev.lsp
    };
};
class Dev extends React.Component {
    render() {
        const { messages, lsp } = this.props;
        const messagesClassList = classNames({
            hidden: lsp,
        }, "agda-dev-body");
        return (React.createElement("section", { className: "agda-dev-view" },
            React.createElement(Panel_1.default, null),
            React.createElement("ol", { className: messagesClassList }, messages.map((msg, i) => React.createElement(Message_1.default, { key: i, message: msg })))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Dev);
//# sourceMappingURL=Dev.js.map