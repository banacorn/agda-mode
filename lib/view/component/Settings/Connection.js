"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Conn = require("../../../connection");
const Err = require("../../../error");
function mapStateToProps(state) {
    return {
        connection: state.connection
    };
}
class Connection extends React.Component {
    componentDidMount() {
        this.agdaConnectionInput.focus();
    }
    constructor(props) {
        super(props);
        this.state = {
            agdaPath: atom.config.get('agda-mode.agdaPath'),
            agdaMessage: '',
            lspEnable: false,
            languageServerPath: atom.config.get('agda-mode.languageServerPath'),
            languageServerMessage: ''
        };
        this.handleAgdaLocationChange = this.handleAgdaLocationChange.bind(this);
        this.handleLanguageServerLocationChange = this.handleLanguageServerLocationChange.bind(this);
        // this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
    }
    handleAgdaLocationChange(event) {
        this.setState({
            agdaPath: event.target.value
        });
        atom.config.set('agda-mode.agdaPath', this.state.agdaPath);
    }
    handleLanguageServerLocationChange(event) {
        this.setState({
            languageServerPath: event.target.value
        });
    }
    // true if Agda is connected
    agdaConnected() {
        return this.props.connection.agda !== null && this.state.agdaMessage === '';
    }
    // connectAgda() {
    //     Conn.validateAgda(this.state.agdaPath)
    //         .then(validated => {
    //             this.setState({
    //                 agdaMessage: ''
    //             });
    //             // this.props.onConnect();
    //         })
    //         .catch((error) => {
    //             this.setState({
    //                 agdaMessage: error.message
    //             });
    //         })
    // }
    searchAgda() {
        Conn.autoSearch('agda')
            .then(location => {
            this.setState({
                agdaPath: location
            });
        })
            .catch(Err.Conn.AutoSearchError, error => {
            this.setState({
                agdaMessage: 'Failed searching for the location of Agda'
            });
        })
            .catch(error => {
            this.setState({
                agdaMessage: error.message
            });
        });
        // prevent this button from submitting the entire form
        return false;
    }
    searchLanguageServer() {
        Conn.autoSearch('agda-language-server')
            .then(location => {
            this.setState({
                languageServerPath: location
            });
        })
            .catch(Err.Conn.AutoSearchError, error => {
            this.setState({
                languageServerPath: 'Failed searching for the location of Agda Language Server'
            });
        })
            .catch(error => {
            this.setState({
                languageServerPath: error.message
            });
        });
        // prevent this button from submitting the entire form
        return false;
    }
    toggleLSPChange() {
        this.setState({
            lspEnable: !this.state.lspEnable
        });
    }
    toggleAgdaConnection() {
        if (this.agdaConnected()) {
            this.props.core.commander.dispatch({ kind: 'Quit' });
        }
        else {
            this.props.core.commander.dispatch({ kind: 'Load' });
        }
    }
    render() {
        const agda = this.props.connection.agda;
        const agdaConnectionStatus = this.agdaConnected() ?
            React.createElement("span", { className: 'inline-block highlight-success' }, "connected") :
            React.createElement("span", { className: 'inline-block highlight-warning' }, "not connected");
        const agdaVersion = this.agdaConnected() && React.createElement("span", { className: 'inline-block highlight' }, agda.version.raw);
        return (React.createElement("section", { className: classNames('agda-settings-connection', this.props.className) },
            React.createElement("form", null,
                React.createElement("ul", { className: 'agda-settings-connection-dashboard' },
                    React.createElement("li", null,
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Connection to Agda"),
                                React.createElement("input", { className: 'input-toggle', checked: this.agdaConnected(), type: 'checkbox', onChange: this.toggleAgdaConnection }))),
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
                            React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda', value: this.state.agdaPath, ref: (ref) => {
                                    if (ref)
                                        this.agdaConnectionInput = ref;
                                }, onChange: this.handleAgdaLocationChange })),
                        React.createElement("p", null,
                            React.createElement("button", { className: 'btn icon icon-search inline-block-tight', onClick: this.searchAgda }, "search"),
                            this.state.agdaMessage &&
                                React.createElement("div", { className: "inset-panel padded text-warning" }, this.state.agdaMessage))),
                    React.createElement("li", null,
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Enable Agda Language Server (experimental)"),
                                React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: this.toggleLSPChange })))),
                    React.createElement("li", null,
                        React.createElement("h2", null,
                            React.createElement("label", { className: 'input-label' },
                                React.createElement("span", null, "Connection to Agda Language Server"),
                                React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: this.toggleLSPChange }))),
                        React.createElement("p", null,
                            React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda Language Server', value: this.state.languageServerPath, onChange: this.handleLanguageServerLocationChange })),
                        React.createElement("p", null,
                            React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight", onClick: this.searchLanguageServer }, "search"),
                            this.state.languageServerMessage &&
                                React.createElement("div", { className: "inset-panel padded text-warning" },
                                    "Language Server: ",
                                    this.state.languageServerMessage)))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Connection);
//# sourceMappingURL=Connection.js.map