"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class ConnectionItem extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        // const { status, ...props } = this.props;
        // const iconClassList = classNames({
        //     'icon-hourglass': status === 'connecting',
        //     'icon-zap': status !== 'connecting'
        // }, 'icon')
        return (React.createElement("li", { className: 'connection' },
            React.createElement("div", { className: "connection-info" },
                React.createElement("header", { className: "compact" },
                    React.createElement("h3", null, this.props.version),
                    React.createElement("div", { className: "connection-dashboard" },
                        React.createElement("span", { className: "icon icon-pin" }),
                        React.createElement("span", { className: "icon icon-x", onClick: this.props.onRemove }))),
                React.createElement("div", { className: "connection-uri" }, this.props.uri))));
        // <div className="connection-header">
        //
        // </div>
        // <div className="connection-uri">{this.props.uri}</div>
        // <div className="connection-overlay">
        // DISCONNECT
        // </div>
        // {connected.toString()}
    }
}
exports.default = ConnectionItem;
//# sourceMappingURL=ConnectionItem.js.map