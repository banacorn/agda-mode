"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
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
        // console.log(Conn.getConnections())
        return (React.createElement("section", { className: this.props.className },
            React.createElement("header", null,
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.props.onNew }, "new"))),
            React.createElement("ol", null)));
    }
}
exports.default = ConnectionList;
//# sourceMappingURL=ConnectionList.js.map