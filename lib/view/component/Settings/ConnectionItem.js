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
            }, 'connection'), onClick: this.props.onSelect },
            React.createElement("header", { className: "compact" },
                React.createElement("h3", null, this.props.version),
                React.createElement("div", { className: "connection-dashboard" },
                    React.createElement("span", { className: "icon icon-x", onClick: this.props.onRemove }))),
            React.createElement("div", { className: "connection-uri" }, this.props.uri)));
    }
}
exports.default = ConnectionItem;
//# sourceMappingURL=ConnectionItem.js.map