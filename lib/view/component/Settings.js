"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
const Breadcrumb_1 = require("./Settings/Breadcrumb");
const Connections_1 = require("./Settings/Connections");
const NewConnection_1 = require("./Settings/NewConnection");
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
        return (React.createElement("section", { className: "agda-settings" },
            React.createElement(Breadcrumb_1.default, { navigate: this.props.navigate, path: this.props.path }),
            React.createElement("ul", { className: "agda-settings-menu" },
                React.createElement("li", { className: this.at('/'), onClick: this.props.navigate('/Connections') },
                    React.createElement("span", { className: "icon icon-plug" }, "Connections"))),
            React.createElement("div", { className: "agda-settings-pages" },
                React.createElement(Connections_1.default, { core: this.props.core, className: this.at('/Connections') }),
                React.createElement(NewConnection_1.default, { core: this.props.core, className: this.at('/Connections/New'), onCancel: this.props.navigate('/Connections') }))));
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