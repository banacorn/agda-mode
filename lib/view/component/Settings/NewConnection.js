"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class NewConnection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            method: 'local'
        };
        this.selectLocal = this.selectLocal.bind(this);
        this.selectRemote = this.selectRemote.bind(this);
    }
    selectLocal() {
        this.setState({
            method: 'local'
        });
    }
    selectRemote() {
        this.setState({
            method: 'remote'
        });
    }
    render() {
        const disableLocal = this.state.method !== 'local';
        const disableRemote = this.state.method !== 'remote';
        const classList = classNames({
            hidden: !this.props.show
        });
        return (React.createElement("section", { className: classList },
            React.createElement("header", null,
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plus" }, "New Connection")),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn icon icon-x inline-block-tight", onClick: this.props.onCancel }, "cancel"))),
            React.createElement("section", null,
                React.createElement("form", { id: "new-connection-dashboard" },
                    React.createElement("input", { id: "local-connection", className: 'input-radio', type: 'radio', name: 'connection-method', defaultChecked: true, onChange: this.selectLocal }),
                    React.createElement("label", { htmlFor: "local-connection" },
                        React.createElement("h3", null,
                            React.createElement("span", { className: "icon icon-home" }, "Local")),
                        React.createElement("p", null, "Establish connection to the Agda executable on your machine. The good old default."),
                        React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda', disabled: disableLocal }),
                        React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", disabled: disableLocal }, "connect")),
                    React.createElement("hr", null),
                    React.createElement("input", { id: "remote-connection", className: 'input-radio', type: 'radio', name: 'connection-method', onChange: this.selectRemote }),
                    React.createElement("label", { htmlFor: "remote-connection" },
                        React.createElement("h3", null,
                            React.createElement("span", { className: "icon icon-globe" }, "Remote")),
                        React.createElement("p", null, "Establish connection to some remote Agda process on this planet via TCP/IP"),
                        React.createElement("div", { id: "remote-connection-inputs" },
                            React.createElement("input", { id: "remote-connection-url", className: 'input-text native-key-bindings', type: 'text', placeholder: 'URL', disabled: disableRemote }),
                            React.createElement("input", { id: "remote-connection-port", className: 'input-text native-key-bindings', type: 'text', placeholder: 'port', defaultValue: "8192", disabled: disableRemote })),
                        React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", disabled: disableRemote }, "connect"))))));
    }
}
// export default connect<View.ConnectionState, {}, Props>(
exports.default = NewConnection;
// export default connect<any, any, any>(
//     mapStateToProps
// )(NewConnection);
//# sourceMappingURL=NewConnection.js.map