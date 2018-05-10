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
    // private agdaConnectionInput: HTMLElement;
    //
    // focusAgdaConnectionInput(){
    //     this.agdaConnectionInput.focus();
    // }
    constructor(props) {
        super(props);
        this.state = {
            enableLanguageServer: atom.config.get('agda-mode.languageServerPath') === '',
        };
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
        this.agdaConnected = this.agdaConnected.bind(this);
        this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.toggleEnableLanguageServer = this.toggleEnableLanguageServer.bind(this);
        this.toggleLanguageServerConnection = this.toggleLanguageServerConnection.bind(this);
    }
    ////////////////////////////////////////////////////
    // Agda
    ////////////////////////////////////////////////////
    toggleAgdaConnection() {
        if (this.agdaConnected()) {
            this.props.core.commander.dispatch({ kind: 'Quit' });
        }
        else {
            this.connectAgda();
        }
    }
    // true if Agda is connected
    agdaConnected() {
        return this.props.connection.agda !== null && this.props.connection.agdaMessage === '';
    }
    connectAgda() {
        this.props.core.commander.dispatch({ kind: 'Load' });
    }
    searchAgda() {
        Conn.autoSearch('agda')
            .then(Conn.validateAgda)
            .then(Conn.setAgdaPath)
            .then(() => {
            this.forceUpdate();
        })
            .catch(this.props.core.connection.handleError);
        // prevent this button from submitting the entire form
        return false;
    }
    ////////////////////////////////////////////////////
    // Languager Server
    ////////////////////////////////////////////////////
    toggleEnableLanguageServer() {
        this.setState({
            enableLanguageServer: !this.state.enableLanguageServer
        });
    }
    toggleLanguageServerConnection() {
    }
    render() {
        const agda = this.props.connection.agda;
        const querying = this.props.connection.querying;
        const className = classNames('agda-settings-connection', this.props.className, {
            querying: querying
        });
        const agdaConnectionStatus = this.agdaConnected() ?
            React.createElement("span", { className: 'inline-block highlight-success' }, "connected") :
            React.createElement("span", { className: 'inline-block highlight-warning' }, "not connected");
        const agdaVersion = this.agdaConnected() && React.createElement("span", { className: 'inline-block highlight' }, agda.version.raw);
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
                                React.createElement(MiniEditor_1.default, { value: atom.config.get('agda-mode.agdaPath'), placeholder: 'path to Agda', ref: (ref) => {
                                        if (ref)
                                            this.props.core.view.editors.connection.resolve(ref);
                                    }, onConfirm: (path) => {
                                        atom.config.set('agda-mode.agdaPath', path);
                                        if (!querying) {
                                            this.connectAgda();
                                        }
                                    }, onCancel: () => {
                                        this.props.core.view.editors.focusMain();
                                    } })),
                            React.createElement("p", null,
                                React.createElement("button", { className: 'btn icon icon-search inline-block-tight', onClick: this.searchAgda }, "auto search")),
                            this.props.connection.agdaMessage &&
                                React.createElement("p", { className: "inset-panel padded text-warning" }, this.props.connection.agdaMessage))),
                    React.createElement("li", null,
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Enable Agda Language Server (experimental)"),
                                React.createElement("input", { className: 'input-toggle', type: 'checkbox', disabled: querying, onChange: this.toggleEnableLanguageServer })))),
                    React.createElement("li", { className: classNames({ hidden: this.state.enableLanguageServer }) },
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Connection to Agda Language Server"),
                                React.createElement("input", { className: 'input-toggle', type: 'checkbox', disabled: querying, onChange: this.toggleLanguageServerConnection }))),
                        React.createElement("div", null,
                            React.createElement("p", null,
                                React.createElement("input", { value: atom.config.get('agda-mode.languageServerPath'), className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda Language Server', disabled: querying })),
                            React.createElement("p", null,
                                React.createElement("button", { className: 'btn icon icon-search inline-block-tight', disabled: querying }, "auto search"))))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Connection);
//# sourceMappingURL=Connection.js.map