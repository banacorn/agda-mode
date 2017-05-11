"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const ConnectionItem_1 = require("./ConnectionItem");
function mapStateToProps(state) {
    return {
        state: state.connection
    };
}
class ConnectionList extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {
        //     method: 'local',
        //     localURL: '',
        //     localMessage: ''
        // };
        // this.selectLocal = this.selectLocal.bind(this);
        // this.selectRemote = this.selectRemote.bind(this);
        // this.handleLocalURLChange = this.handleLocalURLChange.bind(this);
    }
    render() {
        return (React.createElement("section", { className: this.props.className },
            React.createElement("header", null,
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.props.onNew }, "new"))),
            React.createElement("ol", null, this.props.state.connections.map((conn) => {
                return React.createElement(ConnectionItem_1.default, { key: conn.guid, uri: conn.uri, version: conn.version.sem, onRemove: () => {
                        // Conn.removeConnection(conn.guid);
                    } });
            }))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps
// mapDispatchToProps
)(ConnectionList);
//# sourceMappingURL=ConnectionList.js.map