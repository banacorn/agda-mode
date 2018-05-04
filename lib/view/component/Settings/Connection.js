"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const Conn = require("../../../connection");
const Err = require("../../../error");
function mapStateToProps(state) {
    return {
        connection: state.connection
    };
}
class Connection extends React.Component {
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
        this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
    }
    handleAgdaLocationChange(event) {
        this.setState({
            agdaPath: event.target.value
        });
    }
    handleLanguageServerLocationChange(event) {
        this.setState({
            languageServerPath: event.target.value
        });
    }
    connectAgda() {
        Conn.validateAgda(this.state.agdaPath)
            .then(validated => {
            this.setState({
                agdaMessage: ''
            });
            this.props.onConnect(validated);
        })
            .catch((error) => {
            this.setState({
                agdaMessage: error.message
            });
        });
    }
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
    render() {
        const agda = this.props.connection.agda;
        const agdaOK = agda && this.state.agdaMessage === '';
        const agdaConnectionStatus = agdaOK ?
            React.createElement("span", { className: 'inline-block highlight-success' }, "connected") :
            React.createElement("span", { className: 'inline-block highlight-warning' }, "not connected");
        const agdaVersion = agdaOK && React.createElement("span", { className: 'inline-block highlight' }, agda.version.raw);
        const agdaButtonConnect = React.createElement("button", { className: 'btn btn-primary icon icon-zap inline-block-tight', onClick: this.connectAgda, disabled: this.state.lspEnable }, "agda-mode:load");
        const agdaButtonDisconnect = React.createElement("button", { className: 'btn btn-error icon icon-remove-close inline-block-tight', onClick: this.props.onDisconnect, disabled: this.state.lspEnable }, "agda-mode:quit");
        return (React.createElement("section", { className: this.props.className },
            React.createElement("form", null,
                React.createElement("h1", { className: 'inline-block' }, "Agda"),
                agdaConnectionStatus,
                agdaVersion,
                React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda', value: this.state.agdaPath, onChange: this.handleAgdaLocationChange }),
                React.createElement("p", null,
                    React.createElement("button", { className: 'btn icon icon-search inline-block-tight', onClick: this.searchAgda }, "search"),
                    agdaOK ? agdaButtonDisconnect : agdaButtonConnect),
                this.state.agdaMessage &&
                    React.createElement("div", { className: "inset-panel padded text-warning" }, this.state.agdaMessage)),
            React.createElement("hr", null),
            React.createElement("h3", null,
                React.createElement("span", { className: "icon icon-beaker" }, "Experimental: Agda Language Server")),
            React.createElement("p", null,
                React.createElement("label", { className: 'input-label' },
                    React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: this.toggleLSPChange }),
                    " enable Agda Language Server")),
            this.state.lspEnable &&
                React.createElement("form", null,
                    React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to the Agda Language Server', value: this.state.languageServerPath, onChange: this.handleLanguageServerLocationChange }),
                    React.createElement("p", null,
                        React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", onClick: this.connectAgda }, "connect"),
                        React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight", onClick: this.searchLanguageServer }, "search"))),
            this.state.languageServerMessage &&
                React.createElement("div", { className: "inset-panel padded text-warning" },
                    "Language Server: ",
                    this.state.languageServerMessage)));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Connection);
//# sourceMappingURL=Connection.js.map