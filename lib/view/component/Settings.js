"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
const Breadcrumb_1 = require("./Settings/Breadcrumb");
const Connection_1 = require("./Settings/Connection");
const Protocol_1 = require("./Settings/Protocol");
function mapStateToProps(state) {
    return {
        uri: state.view.settingsURI
    };
}
function mapDispatchToProps(dispatch) {
    return {
        navigate: (uri) => () => {
            dispatch(Action.VIEW.navigate(uri));
        }
    };
}
class Settings extends React.Component {
    constructor(props) {
        super(props);
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        this.props.core.connection.disconnect = this.props.core.connection.disconnect.bind(this);
    }
    render() {
        const { core } = this.props;
        return (React.createElement("section", { className: "agda-settings native-key-bindings", tabIndex: -1 },
            React.createElement(Breadcrumb_1.default, { navigate: this.props.navigate, uri: this.props.uri }),
            React.createElement("ul", { className: classNames("agda-settings-menu", this.at('/')) },
                React.createElement("li", { onClick: this.props.navigate('/Connection') },
                    React.createElement("span", { className: "icon icon-plug" }, "Connection")),
                React.createElement("li", { onClick: this.props.navigate('/Protocol') },
                    React.createElement("span", { className: "icon icon-comment-discussion" }, "Protocol"))),
            React.createElement("div", { className: "agda-settings-pages" },
                React.createElement(Connection_1.default, { className: this.at('/Connection'), core: this.props.core }),
                React.createElement(Protocol_1.default
                // core={this.props.core}
                , { 
                    // core={this.props.core}
                    className: this.at('/Protocol') }))));
    }
    at(uri) {
        return classNames({
            'hidden': uri !== this.props.uri
        });
    }
    notAt(uri) {
        return classNames({
            'hidden': uri === this.props.uri
        });
    }
}
// <Connections
//     core={this.props.core}
//     className={this.at('/Connections')}
// />
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Settings);
//# sourceMappingURL=Settings.js.map