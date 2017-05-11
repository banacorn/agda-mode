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
        handlePinConnection: (guid) => {
            dispatch(Action.CONNECTION.pinConnection(guid));
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
            React.createElement("ol", null, this.props.state.connections.map((conn) => {
                return React.createElement(ConnectionItem_1.default, { key: conn.guid, uri: conn.uri, version: conn.version.sem, pinned: this.props.state.pinned === conn.guid, onRemove: () => {
                        this.props.handleRemoveConnection(conn.guid);
                    }, onPin: () => {
                        this.props.handlePinConnection(conn.guid);
                    } });
            }))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(ConnectionList);
//# sourceMappingURL=ConnectionList.js.map