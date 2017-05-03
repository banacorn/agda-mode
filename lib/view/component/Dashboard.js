"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
var { CompositeDisposable } = require('atom');
function mapStateToProps(state) {
    return {
        mountAt: state.view.mountAt,
        settingsView: state.view.settingsView
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
class Dashboard extends React.Component {
    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }
    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleSettingsViewButton, {
            title: 'settings',
            delay: 100
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: 300,
            keyBindingCommand: 'agda-mode:toggle-docking'
        }));
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { mountAt, settingsView } = this.props;
        const { core } = this.props;
        const { handleMountAtPane, handleMountAtBottom, handleToggleSettingsView } = this.props;
        const settingsViewClassList = classNames({
            activated: settingsView,
        }, 'no-btn');
        const toggleMountingPosition = classNames({
            activated: mountAt.current === 0 /* Pane */
        }, 'no-btn');
        return (React.createElement("ul", { className: "agda-dashboard" },
            React.createElement("li", null,
                React.createElement("button", { className: settingsViewClassList, onClick: () => {
                        handleToggleSettingsView();
                        if (settingsView)
                            core.view.settingsViewPaneItem.close();
                        else
                            core.view.settingsViewPaneItem.open();
                    }, ref: (ref) => {
                        this.toggleSettingsViewButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-settings" }))),
            React.createElement("li", null,
                React.createElement("button", { className: toggleMountingPosition, onClick: () => {
                        core.view.toggleDocking();
                    }, ref: (ref) => {
                        this.toggleMountingPositionButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-versions" })))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Dashboard);
//# sourceMappingURL=Dashboard.js.map