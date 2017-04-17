"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
// import { View } from '../../types';
const Connections_1 = require("./Settings/Connections");
const Conversations_1 = require("./Settings/Conversations");
// const mapStateToProps = (state: View.State) => {
//     return {
//         messages: state.dev.messages,
//         lsp: state.dev.lsp
//     }
// }
class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabIndex: 0
        };
        this.tabClassName = this.tabClassName.bind(this);
        this.panelClassName = this.panelClassName.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }
    render() {
        return (React.createElement("section", { className: "agda-settings" },
            React.createElement("nav", null,
                React.createElement("ol", null,
                    React.createElement("li", { className: this.tabClassName(0), onClick: this.handleClick(0) },
                        React.createElement("span", { className: 'icon icon-plug' }, "Connections")),
                    React.createElement("li", { className: this.tabClassName(1), onClick: this.handleClick(1) },
                        React.createElement("span", { className: 'icon icon-comment-discussion' }, "Conversations")))),
            React.createElement(Connections_1.default, { className: this.panelClassName(0) }),
            React.createElement(Conversations_1.default, { className: this.panelClassName(1) }, "1")));
    }
    tabClassName(tabIndex) {
        return this.state.tabIndex === tabIndex ? 'selected' : null;
    }
    panelClassName(tabIndex) {
        return classNames('settings-panel', {
            hidden: this.state.tabIndex !== tabIndex
        });
    }
    handleClick(tabIndex) {
        return () => {
            this.setState({
                tabIndex: tabIndex
            });
        };
    }
}
exports.default = react_redux_1.connect()(Settings);
//# sourceMappingURL=Settings.js.map