"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class ConnectionItem extends React.Component {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // const connectedClassNames = classNames({
        //     hidden: !this.props.connected
        // }, 'connection-panel');
        //
        // const disconnectedClassNames = classNames({
        //     hidden: this.props.connected
        // }, 'connection-panel');
        const _a = this.props, { status } = _a, props = __rest(_a, ["status"]);
        // const classList = classNames({
        //     disconnected: status === 'disconnected',
        //     connecting: status === 'connecting',
        //     connected: status === 'connected'
        // }, 'connection')
        const iconClassList = classNames({
            'icon-hourglass': status === 'connecting',
            'icon-zap': status !== 'connecting'
        }, 'icon');
        return (React.createElement("div", { className: 'connection', "data-status": status },
            React.createElement("div", { className: "connection-info" },
                React.createElement("h3", null, this.props.version),
                React.createElement("div", { className: "connection-uri" }, this.props.uri)),
            React.createElement("div", { className: "connection-status" },
                React.createElement("span", { className: iconClassList }))));
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