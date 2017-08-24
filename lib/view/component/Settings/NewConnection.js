"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const Conn = require("../../../connector");
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
            lspLocation: '',
            lspMessage: ''
        };
        this.handleAgdaLocationChange = this.handleAgdaLocationChange.bind(this);
        this.handleLanguageServerLocationChange = this.handleLanguageServerLocationChange.bind(this);
        this.handleAddAgda = this.handleAddAgda.bind(this);
        this.handleAutoSearch = this.handleAutoSearch.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
    }
    handleAgdaLocationChange(event) {
        this.setState({
            agdaLocation: event.target.value
        });
    }
    handleLanguageServerLocationChange(event) {
        this.setState({
            lspLocation: event.target.value
        });
    }
    handleAddAgda() {
        Conn.validate(this.state.agdaLocation)
            .then((conn) => {
            this.props.handleAddConnection(conn);
            this.props.onSuccess();
            this.setState({
                agdaMessage: ''
            });
        })
            .catch((error) => {
            this.setState({
                agdaMessage: error.agdaMessage
            });
        });
    }
    handleAutoSearch() {
        Conn.autoSearch()
            .then(uri => {
            this.setState({
                agdaLocation: uri
            });
        })
            .catch(Conn.AutoSearchFailure, () => {
            this.setState({
                agdaMessage: 'Failed searching for the location of Agda'
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
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.handleAddAgda }, "add"),
                    React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight", onClick: this.handleAutoSearch }, "auto"))),
            this.state.agdaMessage &&
                React.createElement("div", { className: "inset-panel padded text-warning" }, this.state.agdaMessage),
            React.createElement("hr", null),
            React.createElement("h3", null,
                React.createElement("span", { className: "icon icon-beaker" }, "Experimental")),
            React.createElement("p", null,
                React.createElement("label", { className: 'input-label' },
                    React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: this.toggleLSPChange }),
                    " Agda Language Server")),
            this.state.lspEnable &&
                React.createElement("form", null,
                    React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'location of Agda Language Server', value: this.state.lspLocation, onChange: this.handleLanguageServerLocationChange }),
                    React.createElement("p", null,
                        React.createElement("button", { className: "btn icon btn-primary icon-plug inline-block-tight" }, "connect"),
                        React.createElement("button", { className: "btn icon btn-success icon-search inline-block-tight" }, "auto"))),
            this.state.lspMessage &&
                React.createElement("div", { className: "inset-panel padded text-warning" }, this.state.lspMessage)));
    }
}
exports.default = react_redux_1.connect(null, mapDispatchToProps)(NewConnection);
//# sourceMappingURL=NewConnection.js.map