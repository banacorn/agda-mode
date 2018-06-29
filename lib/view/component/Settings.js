"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
const Breadcrumb_1 = require("./Settings/Breadcrumb");
const Connection_1 = require("./Settings/Connection");
const Protocol_1 = require("./Settings/Protocol");
const ReqRes_1 = require("./Settings/Protocol/ReqRes");
function mapStateToProps(state) {
    return {
        uri: state.view.settingsURI,
        protocol: state.protocol,
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
        return (React.createElement("section", { className: 'agda-settings', tabIndex: -1 },
            React.createElement(Breadcrumb_1.default, { navigate: this.props.navigate, uri: this.props.uri }),
            React.createElement("div", { className: 'agda-settings-pages' },
                React.createElement("ul", { className: classNames('agda-settings-menu', this.at({ path: '/' })) },
                    React.createElement("li", { onClick: this.props.navigate({ path: '/Connection' }) },
                        React.createElement("span", { className: 'icon icon-plug' }, "Connection")),
                    React.createElement("li", { onClick: this.props.navigate({ path: '/Protocol' }) },
                        React.createElement("span", { className: 'icon icon-comment-discussion' }, "Protocol"))),
                React.createElement(Connection_1.default, { className: this.at({ path: '/Connection' }), core: this.props.core }),
                React.createElement(Protocol_1.default, { core: this.props.core, className: this.at({ path: '/Protocol' }) }),
                React.createElement(ReqRes_1.default, { className: this.at({ path: '/Protocol/*' }), log: this.props.protocol.log, index: this.props.uri.param }))));
    }
    at(uri) {
        return classNames({
            'hidden': uri.path !== this.props.uri.path
        });
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Settings);
//# sourceMappingURL=Settings.js.map