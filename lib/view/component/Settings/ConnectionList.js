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
        handleRemoveConnection: (guid) => {
            dispatch(Action.CONNECTION.removeConnection(guid));
        },
        handleSelectConnection: (guid) => {
            dispatch(Action.CONNECTION.selectConnection(guid));
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
            React.createElement("ol", null, this.props.state.connectionInfos.map((connInfo) => {
                return React.createElement(ConnectionItem_1.default, { key: connInfo.guid, uri: connInfo.uri, version: connInfo.version.sem, selected: this.props.state.selected === connInfo.guid, connected: this.props.state.connected === connInfo.guid, 
                    // pinned={this.props.state.pinned === connInfo.guid}
                    // current={this.props.state.current === connInfo.guid}
                    onSelect: () => {
                        if (this.props.state.connected !== connInfo.guid) {
                            this.props.handleSelectConnection(connInfo.guid);
                            this.props.onSelect(connInfo);
                        }
                    }, onRemove: (e) => {
                        this.props.handleRemoveConnection(connInfo.guid);
                        this.props.onRemove(connInfo);
                        e.stopPropagation();
                    } });
            }))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(ConnectionList);
//# sourceMappingURL=ConnectionList.js.map