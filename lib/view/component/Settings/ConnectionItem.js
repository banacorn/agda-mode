"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class ConnectionItem extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("li", { className: classNames({
                selected: this.props.selected,
                connected: this.props.connected,
                erred: this.props.erred,
            }, 'connection-item'), onClick: this.props.onSelect, onDoubleClick: this.props.onSelectAndLoad },
            React.createElement("header", { className: "compact" },
                React.createElement("h3", null,
                    React.createElement("div", { className: 'icon icon-tag' }),
                    React.createElement("div", null, this.props.version)),
                React.createElement("div", { className: "connection-dashboard" },
                    this.props.connected && !this.props.erred && React.createElement("span", { className: "connection-status" }, "CONNECTED"),
                    this.props.selected && !this.props.connected && !this.props.erred && React.createElement("span", { className: "connection-status" }, "APPOINTED"),
                    this.props.erred && React.createElement("span", { className: "connection-status" }, "ERRED"),
                    React.createElement("span", { className: "icon icon-x", onClick: this.props.onRemove }))),
            React.createElement("ul", { className: 'list-group' },
                React.createElement("li", { className: 'list-item' },
                    React.createElement("div", { className: 'icon icon-location' }),
                    React.createElement("div", null,
                        "Location: ",
                        this.props.location)),
                React.createElement("li", { className: 'list-item' },
                    React.createElement("div", { className: 'icon icon-comment-discussion' }),
                    React.createElement("div", null,
                        "Protocol: ",
                        this.props.protocol)))));
    }
}
exports.default = ConnectionItem;
//# sourceMappingURL=ConnectionItem.js.map