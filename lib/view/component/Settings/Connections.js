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
class Connections extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const noConnections = this.props.state.connectionInfos.length === 0;
        return (React.createElement("section", { className: this.props.className },
            React.createElement("h2", null, "Connections"),
            React.createElement("p", null,
                "A list of previously (or to be) established connections to Agda.",
                React.createElement("br", null),
                "The ",
                React.createElement("span", { className: 'text-info' }, "appointed"),
                " connection will be established on reload or when double-clicked."),
            noConnections
                ? React.createElement("p", { className: 'background-message' },
                    "No Connections",
                    React.createElement("br", null),
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.props.onNew }, "Establish a new one"))
                : React.createElement("p", null,
                    React.createElement("button", { className: "btn icon icon-plus inline-block-tight", onClick: this.props.onNew }, "Establish new connection")),
            React.createElement("ol", null, this.props.state.connectionInfos.map((connInfo) => {
                return React.createElement(ConnectionItem_1.default, { key: connInfo.guid, uri: connInfo.uri, protocol: connInfo.protocol, version: connInfo.version.raw, selected: this.props.state.selected === connInfo.guid, connected: this.props.state.connected === connInfo.guid, erred: this.props.state.erred === connInfo.guid, onSelect: () => {
                        this.props.handleSelect(connInfo.guid);
                        this.props.onSelect(connInfo);
                    }, onSelectAndLoad: () => {
                        this.props.handleSelect(connInfo.guid);
                        // this.props.handleLoad(connInfo.guid);
                        this.props.onSelectAndLoad(connInfo);
                    }, onRemove: (e) => {
                        this.props.handleRemove(connInfo.guid);
                        this.props.onRemove(connInfo);
                        e.stopPropagation();
                    } });
            }))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Connections);
// <p>
//     <span className='inline-block highlight-info'>appointed default</span>
//     <span className='inline-block highlight-success'>connected</span>
// </p>
//# sourceMappingURL=Connections.js.map