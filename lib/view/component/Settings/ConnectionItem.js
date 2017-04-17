"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class ConnectionItem extends React.Component {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
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
                    React.createElement("button", { className: "btn icon icon-trashcan inline-block-tight connection-delete" }, "remove"),
                    React.createElement("button", { className: "btn btn-primary icon icon-plug inline-block-tight" }, "connect"))),
            React.createElement("div", { className: "connection-uri" }, this.props.uri)));
    }
}
exports.default = ConnectionItem;
//# sourceMappingURL=ConnectionItem.js.map