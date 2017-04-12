"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
// const mapStateToProps = (state: View.State) => {
//     return {
//         messages: state.dev.messages,
//         lsp: state.dev.lsp
//     }
// }
class ConnectionItem extends React.Component {
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
        // <button className='btn btn-error icon icon-trashcan inline-block-tight'>Delete</button>
        // const {children, dispatch, ...props} = this.props;
        const connectedClassNames = classNames({
            hidden: !this.props.connected
        }, 'connection-panel');
        const disconnectedClassNames = classNames({
            hidden: this.props.connected
        }, 'connection-panel');
        return (React.createElement("div", { className: "connection" },
            React.createElement("div", { className: "connection-header" },
                React.createElement("h3", null, this.props.version),
                React.createElement("div", { className: connectedClassNames },
                    React.createElement("button", { className: "btn btn-warning icon icon-stop inline-block-tight" }, "disonnect")),
                React.createElement("div", { className: disconnectedClassNames },
                    React.createElement("button", { className: "btn icon icon-trashcan inline-block-tight connection-delete" }, "delete"),
                    React.createElement("button", { className: "btn btn-primary icon icon-plug inline-block-tight" }, "connect"))),
            React.createElement("div", { className: "connection-uri" }, this.props.uri)));
    }
}
exports.default = react_redux_1.connect(null, null)(ConnectionItem);
//# sourceMappingURL=ConnectionItem.js.map