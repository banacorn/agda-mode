"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Conn = require("../../../connection");
const Err = require("../../../error");
const MiniEditor_1 = require("../MiniEditor");
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
            agdaPath: atom.config.get('agda-mode.agdaPath'),
            agdaMessage: '',
            lspEnable: false,
            languageServerPath: atom.config.get('agda-mode.languageServerPath'),
            languageServerMessage: ''
        };
        // this.handleAgdaPathChange = this.handleAgdaPathChange.bind(this);
        // this.handleLanguageServerPathChange = this.handleLanguageServerPathChange.bind(this);
        // this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
    }
    // handleLanguageServerPathChange(event) {
    //     this.setState({
    //         languageServerPath: event.target.value
    //     });
    // }
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
            .then(path => {
            this.setState({
                agdaPath: path
            });
        })
            .catch(Err.Conn.AutoSearchError, error => {
            this.setState({
                agdaMessage: 'Failed searching for the path of Agda'
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
                            React.createElement(MiniEditor_1.default, { value: this.state.agdaPath, placeholder: 'path to Agda', ref: (ref) => {
                                    if (ref)
                                        this.props.core.view.editors.connection.resolve(ref);
                                }, onConfirm: (path) => {
                                    this.setState({
                                        agdaPath: path
                                    });
                                    atom.config.set('agda-mode.agdaPath', this.state.agdaPath);
                                }, onCancel: () => {
                                    this.props.core.view.editors.focusMain();
                                } })),
                        React.createElement("p", null,
                            React.createElement("button", { className: 'btn icon icon-search inline-block-tight', onClick: this.searchAgda }, "auto search"),
                            this.state.agdaMessage &&
                                React.createElement("div", { className: "inset-panel padded text-warning" }, this.state.agdaMessage)),
                        React.createElement("p", null)),
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
                            React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda Language Server', value: this.state.languageServerPath })),
                        React.createElement("p", null,
                            React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight" }, "search"),
                            this.state.languageServerMessage &&
                                React.createElement("div", { className: "inset-panel padded text-warning" },
                                    "Language Server: ",
                                    this.state.languageServerMessage)))))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Connection);
//# sourceMappingURL=Connection.js.map