"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
const Breadcrumb_1 = require("./Settings/Breadcrumb");
const Connections_1 = require("./Settings/Connections");
const NewConnection_1 = require("./Settings/NewConnection");
const Protocol_1 = require("./Settings/Protocol");
function mapStateToProps(state) {
    return {
        path: state.settings
    };
}
function mapDispatchToProps(dispatch) {
    return {
        navigate: (path) => () => {
            dispatch(Action.SETTINGS.navigate(path));
        }
    };
}
class Settings extends React.Component {
    constructor(props) {
        super(props);
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        const { core } = this.props;
        return (React.createElement("section", { className: "agda-settings" },
            React.createElement(Breadcrumb_1.default, { navigate: this.props.navigate, path: this.props.path }),
            React.createElement("ul", { className: classNames("agda-settings-menu", this.at('/')) },
                React.createElement("li", { onClick: this.props.navigate('/Connections') },
                    React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                React.createElement("li", { onClick: this.props.navigate('/Protocol') },
                    React.createElement("span", { className: "icon icon-comment-discussion" }, "Protocol"))),
            React.createElement("div", { className: "agda-settings-pages" },
                React.createElement(Connections_1.default, { className: this.at('/Connections'), onNew: this.props.navigate('/Connections/New'), onSelect: (connInfo) => {
                        core.connector.select(connInfo);
                    }, onSelectAndLoad: (connInfo) => {
                        core.connector.select(connInfo);
                        core.commander.dispatch({
                            kind: 'Load',
                            editsFile: false
                        });
                    }, onRemove: (connInfo) => {
                        core.connector.unselect(connInfo);
                    } }),
                React.createElement(NewConnection_1.default, { core: this.props.core, className: this.at('/Connections/New'), onSuccess: this.props.navigate('/Connections') }),
                React.createElement(Protocol_1.default
                // core={this.props.core}
                , { 
                    // core={this.props.core}
                    className: this.at('/Protocol') }))));
    }
    at(path) {
        return classNames({
            'hidden': path !== this.props.path
        });
    }
    notAt(path) {
        return classNames({
            'hidden': path === this.props.path
        });
    }
}
// <Connections
//     core={this.props.core}
//     className={this.at('/Connections')}
// />
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Settings);
// <nav>
//     <ol>
//         <li
//             className={this.tabClassName(0)}
//             onClick={this.handleClick(0)}
//         ><span className='icon icon-plug'>Connections</span></li>
//         <li
//             className={this.tabClassName(1)}
//             onClick={this.handleClick(1)}
//         ><span className='icon icon-comment-discussion'>Conversations</span></li>
//     </ol>
// </nav>
// <Connections
//     core={this.props.core}
//     className={this.panelClassName(0)}
// />
// <Conversations className={this.panelClassName(1)}>
//     1
// </Conversations>
//# sourceMappingURL=Settings.js.map