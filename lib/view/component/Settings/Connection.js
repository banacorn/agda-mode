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
        setLanguageServerMessage: (message) => {
            dispatch(Action.CONNECTION.setLanguageServerMessage(message));
        },
        toggleEnableLanguageServer: (enable) => {
            dispatch(Action.CONNECTION.enableLanguageServer(enable));
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
        this.state = {
            enableLanguageServer: atom.config.get('agda-mode.languageServerPath') === '',
        };
        // agda
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
        this.agdaConnected = this.agdaConnected.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.connectAgda = this.connectAgda.bind(this);
        // language server
        this.toggleLanguageServerConnection = this.toggleLanguageServerConnection.bind(this);
        this.languageServerConnected = this.languageServerConnected.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.connectLanguageServer = this.connectLanguageServer.bind(this);
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
            .catch(this.props.core.connection.handleAgdaError);
        // prevent this button from submitting the entire form
        return false;
    }
    ////////////////////////////////////////////////////
    // Languager Server
    ////////////////////////////////////////////////////
    toggleLanguageServerConnection(event) {
    }
    languageServerConnected() {
        return this.props.connection.languageServer !== null
            && this.props.connection.languageServerMessage === ''
            && this.props.connection.languageServerEnabled;
    }
    searchLanguageServer() {
        Conn.autoSearch('agda-language-server')
            .then(Conn.validateLanguageServer)
            .then(Conn.setLanguageServerPath)
            .then(() => {
            this.forceUpdate();
        })
            .catch(this.props.core.connection.handleLanguageServerError);
        // prevent this button from submitting the entire form
        return false;
    }
    connectLanguageServer() {
        // this.props.core.commander.dispatch({ kind: 'Load' });
    }
    ////////////////////////////////////////////////////
    // Render
    ////////////////////////////////////////////////////
    render() {
        const showLSP = classNames({ hidden: !atom.inDevMode() });
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
                                React.createElement("p", { className: "inset-panel padded text-warning error" }, this.props.connection.agdaMessage))),
                    React.createElement("li", { className: showLSP },
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Enable Agda Language Server (experimental)"),
                                React.createElement("input", { className: 'input-toggle', defaultChecked: this.props.connection.languageServerEnabled, type: 'checkbox', disabled: querying, onChange: () => {
                                        atom.config.set('agda-mode.languageServerEnabled', !this.props.connection.languageServerEnabled);
                                        if (this.props.connection.languageServerEnabled)
                                            this.props.toggleEnableLanguageServer(false);
                                        else
                                            this.props.toggleEnableLanguageServer(true);
                                    } })))),
                    React.createElement("li", { className: classNames({ hidden: !this.props.connection.languageServerEnabled }) },
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Connection to Agda Language Server"),
                                React.createElement("input", { className: 'input-toggle', type: 'checkbox', disabled: querying, onChange: this.toggleLanguageServerConnection }))),
                        React.createElement("div", null,
                            React.createElement("p", null,
                                React.createElement("input", { value: atom.config.get('agda-mode.languageServerPath'), defaultChecked: this.languageServerConnected(), onSubmit: this.connectLanguageServer, className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda Language Server', disabled: querying })),
                            React.createElement("p", null,
                                React.createElement("button", { className: 'btn icon icon-search inline-block-tight', onClick: this.searchLanguageServer, disabled: querying }, "auto search")),
                            this.props.connection.languageServerMessage &&
                                React.createElement("p", { className: "inset-panel padded text-warning" }, this.props.connection.languageServerMessage)))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Connection);
//# sourceMappingURL=Connection.js.map