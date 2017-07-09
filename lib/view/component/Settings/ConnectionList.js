"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const ConnectionItem_1 = require("./ConnectionItem");
const Action = require("../../actions");
function mapStateToProps(state) {
    return {
        state: state.connection
    };
}
function mapDispatchToProps(dispatch) {
    return {
        handleRemove: (guid) => {
            dispatch(Action.CONNECTION.removeConnection(guid));
        },
        handleSelect: (guid) => {
            dispatch(Action.CONNECTION.selectConnection(guid));
        },
        handleLoad: (guid) => {
            dispatch(Action.CONNECTION.connect(guid));
        }
    };
}
class ConnectionList extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("section", { className: this.props.className },
            React.createElement("header", null,
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.props.onNew }, "new"))),
            React.createElement("p", null,
                React.createElement("span", { className: 'inline-block highlight-info' }, "appointed default"),
                React.createElement("span", { className: 'inline-block highlight-success' }, "connected")),
            React.createElement("ol", null, this.props.state.connectionInfos.map((connInfo) => {
                return React.createElement(ConnectionItem_1.default, { key: connInfo.guid, uri: connInfo.uri, version: connInfo.version.sem, selected: this.props.state.selected === connInfo.guid, connected: this.props.state.connected === connInfo.guid, onSelect: () => {
                        this.props.handleSelect(connInfo.guid);
                        this.props.onSelect(connInfo);
                    }, onSelectAndLoad: () => {
                        this.props.handleSelect(connInfo.guid);
                        this.props.handleLoad(connInfo.guid);
                        this.props.onSelectAndLoad(connInfo);
                    }, onRemove: (e) => {
                        this.props.handleRemove(connInfo.guid);
                        this.props.onRemove(connInfo);
                        e.stopPropagation();
                    } });
            }))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(ConnectionList);
//# sourceMappingURL=ConnectionList.js.map