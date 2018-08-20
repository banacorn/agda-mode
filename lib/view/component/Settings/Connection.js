"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Conn = require("../../../connection");
const Action = require("../../actions");
const MiniEditor_1 = require("../MiniEditor");
function mapDispatchToProps(dispatch) {
    return {
        setAgdaMessage: (message) => {
            dispatch(Action.CONNECTION.setAgdaMessage(message));
        },
    };
}
function mapStateToProps(state) {
    return {
        connection: state.connection
    };
}
class Connection extends React.Component {
    constructor(props) {
        super(props);
        // agda
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
        this.agdaConnected = this.agdaConnected.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.reconnectAgda = this.reconnectAgda.bind(this);
    }
    ////////////////////////////////////////////////////
    // Agda
    ////////////////////////////////////////////////////
    toggleAgdaConnection() {
        if (this.agdaConnected()) {
            this.props.core.commander.dispatch({ kind: 'Quit' });
        }
        else {
            this.reconnectAgda();
        }
    }
    // true if Agda is connected
    agdaConnected() {
        return this.props.connection.agda !== null && this.props.connection.agdaMessage === '';
    }
    reconnectAgda() {
        this.props.core.commander.dispatch({ kind: 'Restart' });
    }
    searchAgda() {
        Conn.autoSearch('agda')
            .then(Conn.validateAgda)
            .then(Conn.setAgdaPath)
            .then(() => {
            this.forceUpdate();
        })
            .catch(this.props.core.connection.handleAgdaError);
        // prevent this button from submitting the entire form
        return false;
    }
    ////////////////////////////////////////////////////
    // Render
    ////////////////////////////////////////////////////
    render() {
        const agda = this.props.connection.agda;
        const querying = this.props.connection.querying;
        const className = classNames('agda-settings-connection', this.props.className, {
            querying: querying
        });
        return (React.createElement("section", { className: className },
            React.createElement("form", null,
                React.createElement("ul", { className: 'agda-settings-connection-dashboard' },
                    React.createElement("li", { id: 'agda-settings-connection-agda' },
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Connection to Agda"),
                                React.createElement("input", { className: 'input-toggle', checked: this.agdaConnected(), type: 'checkbox', onChange: this.toggleAgdaConnection }))),
                        React.createElement("div", null,
                            React.createElement("p", null,
                                "Connection: ",
                                this.agdaConnected() ? 'established' : 'not established'),
                            React.createElement("p", null,
                                "Established path: ",
                                this.agdaConnected() ? agda.path : 'unknown'),
                            React.createElement("p", null,
                                "Version: ",
                                this.agdaConnected() ? agda.version.raw : 'unknown'),
                            React.createElement("p", null,
                                "Protocol: ",
                                this.agdaConnected() ? agda.protocol : 'unknown'),
                            React.createElement("p", null,
                                React.createElement(MiniEditor_1.default, { value: atom.config.get('agda-mode.agdaPath'), placeholder: 'path to Agda', ref: (ref) => {
                                        if (ref)
                                            this.props.core.view.editors.connection.resolve(ref);
                                    }, onConfirm: (path) => {
                                        atom.config.set('agda-mode.agdaPath', path);
                                        if (!querying) {
                                            this.reconnectAgda();
                                        }
                                    }, onCancel: () => {
                                        this.props.core.view.editors.focusMain();
                                    } })),
                            React.createElement("p", null,
                                React.createElement("button", { className: 'btn icon icon-search inline-block-tight', onClick: this.searchAgda }, "auto search")),
                            this.props.connection.agdaMessage &&
                                React.createElement("p", { className: "inset-panel padded text-warning error" }, this.props.connection.agdaMessage)))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Connection);
//# sourceMappingURL=Connection.js.map