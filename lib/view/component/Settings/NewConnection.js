"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const Conn = require("../../../connection");
const Err = require("../../../error");
const Action = require("../../actions");
function mapDispatchToProps(dispatch) {
    return {
        handleAddConnection: (connInfo) => {
            dispatch(Action.CONNECTION.addConnection(connInfo));
        }
    };
}
class NewConnection extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            agdaLocation: '',
            agdaMessage: '',
            lspEnable: false,
            languageServerLocation: '',
            languageServerMessage: ''
        };
        this.handleAgdaLocationChange = this.handleAgdaLocationChange.bind(this);
        this.handleLanguageServerLocationChange = this.handleLanguageServerLocationChange.bind(this);
        this.addAgda = this.addAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
    }
    handleAgdaLocationChange(event) {
        this.setState({
            agdaLocation: event.target.value
        });
    }
    handleLanguageServerLocationChange(event) {
        this.setState({
            languageServerLocation: event.target.value
        });
    }
    addAgda() {
        Conn.validateAgda(this.state.agdaLocation)
            .then(Conn.mkConnectionInfo)
            .then(connInfo => {
            // location of Agda is valid, clear any error message
            this.setState({
                agdaMessage: ''
            });
            if (this.state.lspEnable) {
                Conn.validateLanguageServer(this.state.languageServerLocation)
                    .then(languageServerProcInfo => {
                    connInfo.languageServer = languageServerProcInfo;
                    this.props.handleAddConnection(connInfo);
                    this.props.onSuccess();
                    // location of the language server is valid, clear any error message
                    this.setState({
                        languageServerMessage: ''
                    });
                })
                    .catch((error) => {
                    this.setState({
                        languageServerMessage: error.message
                    });
                });
            }
            else {
                this.props.handleAddConnection(connInfo);
                this.props.onSuccess();
            }
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
                agdaLocation: location
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
                languageServerLocation: location
            });
        })
            .catch(Err.Conn.AutoSearchError, error => {
            this.setState({
                languageServerLocation: 'Failed searching for the location of Agda Language Server'
            });
        })
            .catch(error => {
            this.setState({
                languageServerLocation: error.message
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
        return (React.createElement("section", { className: this.props.className },
            React.createElement("h2", null,
                React.createElement("span", { className: "icon icon-plus" }, "Establish new connection")),
            React.createElement("form", null,
                React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'location of Agda', value: this.state.agdaLocation, onChange: this.handleAgdaLocationChange }),
                React.createElement("p", null,
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.addAgda, disabled: this.state.lspEnable }, "add"),
                    React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight", onClick: this.searchAgda }, "auto"))),
            this.state.agdaMessage &&
                React.createElement("div", { className: "inset-panel padded text-warning" },
                    "Agda: ",
                    this.state.agdaMessage),
            React.createElement("hr", null),
            React.createElement("h3", null,
                React.createElement("span", { className: "icon icon-beaker" }, "Experimental")),
            React.createElement("p", null,
                React.createElement("label", { className: 'input-label' },
                    React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: this.toggleLSPChange }),
                    " Agda Language Server")),
            this.state.lspEnable &&
                React.createElement("form", null,
                    React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'location of Agda Language Server', value: this.state.languageServerLocation, onChange: this.handleLanguageServerLocationChange }),
                    React.createElement("p", null,
                        React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.addAgda }, "add"),
                        React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight", onClick: this.searchLanguageServer }, "auto"))),
            this.state.languageServerMessage &&
                React.createElement("div", { className: "inset-panel padded text-warning" },
                    "Language Server: ",
                    this.state.languageServerMessage)));
    }
}
exports.default = react_redux_1.connect(null, mapDispatchToProps)(NewConnection);
//# sourceMappingURL=NewConnection.js.map