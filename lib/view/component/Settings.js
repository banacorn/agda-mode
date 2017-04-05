"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const mapStateToProps = (state) => {
    return {
        messages: state.dev.messages,
        lsp: state.dev.lsp
    };
};
class Settings extends React.Component {
    render() {
        const { messages, lsp } = this.props;
        // const messagesClassList = classNames({
        //     hidden: lsp,
        // }, "agda-dev-body");
        return (React.createElement("section", { className: "agda-settings" },
            React.createElement("nav", null,
                React.createElement("ol", null,
                    React.createElement("li", { className: "selected" },
                        React.createElement("span", { className: 'icon icon-plug' }, "Connections")),
                    React.createElement("li", null,
                        React.createElement("span", { className: 'icon icon-comment-discussion' }, "Conversations"))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Settings);
//# sourceMappingURL=Settings.js.map