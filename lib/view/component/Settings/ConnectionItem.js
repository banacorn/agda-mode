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
                connected: this.props.connected
            }, 'connection-item'), onClick: this.props.onSelect, onDoubleClick: this.props.onSelectAndLoad },
            React.createElement("header", { className: "compact" },
                React.createElement("h3", null,
                    React.createElement("div", { className: 'icon icon-tag' }),
                    React.createElement("div", null, this.props.version)),
                React.createElement("div", { className: "connection-dashboard" },
                    React.createElement("span", { className: "icon icon-x", onClick: this.props.onRemove }))),
            React.createElement("ul", { className: 'list-group' },
                React.createElement("li", { className: 'list-item' },
                    React.createElement("div", { className: 'icon icon-location' }),
                    React.createElement("div", null,
                        "Location: ",
                        this.props.uri)),
                React.createElement("li", { className: 'list-item' },
                    React.createElement("div", { className: 'icon icon-comment-discussion' }),
                    React.createElement("div", null,
                        "Protocol: ",
                        this.props.protocol)))));
    }
}
exports.default = ConnectionItem;
//# sourceMappingURL=ConnectionItem.js.map