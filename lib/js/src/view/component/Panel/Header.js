"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const _ = require("lodash");
const classNames = require("classnames");
const Action = require("../../actions");
var Dashboard = require('../../../Reason/View/Panel/Dashboard.bs').jsComponent;
function toStyle(type) {
    switch (type) {
        case 3 /* Error */: return 'error';
        case 4 /* Warning */: return 'warning';
        case 1 /* Info */: return 'info';
        case 2 /* Success */: return 'success';
        case 0 /* PlainText */: return 'plain-text';
        default: return '';
    }
}
function mapStateToProps(state) {
    return {
        text: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated,
        mountAt: state.view.mountAt,
        settingsView: state.view.settingsView,
        pending: state.protocol.pending
    };
}
function mapDispatchToProps(dispatch) {
    return {
        handleMountAtPane: () => {
            dispatch(Action.VIEW.mountAtPane());
        },
        handleMountAtBottom: () => {
            dispatch(Action.VIEW.mountAtBottom());
        },
        handleToggleSettingsView: () => {
            dispatch(Action.VIEW.toggleSettings());
        }
    };
}
class Header extends React.Component {
    render() {
        const { text, style, core, inputMethodActivated, pending, mountAt, settingsView } = this.props;
        const classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, 'agda-header');
        return (React.createElement("div", { className: classes },
            React.createElement("h1", { className: `text-${toStyle(style)}` }, text),
            React.createElement(Dashboard, { isPending: pending, mountAt: mountAt.current === 1 /* Bottom */ ? 'bottom' : 'pane', onMountChange: (at) => {
                    core.view.toggleDocking();
                    if (at === "bottom") {
                        this.props.handleMountAtBottom();
                    }
                    else {
                        this.props.handleMountAtPane();
                    }
                }, settingsViewOn: settingsView, onSettingsViewToggle: (isActivated) => {
                    this.props.handleToggleSettingsView();
                    if (isActivated) {
                        core.view.tabs.open('settings');
                    }
                    else {
                        core.view.tabs.close('settings');
                    }
                } })));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Header);
//# sourceMappingURL=Header.js.map