"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../../actions");
// Atom shits
const atom_1 = require("atom");
function mapStateToProps(state) {
    return {
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
class Dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.subscriptions = new atom_1.CompositeDisposable;
    }
    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleSettingsViewButton, {
            title: 'settings',
            delay: {
                show: 100,
                hide: 1000
            }
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: {
                show: 300,
                hide: 1000
            },
            keyBindingCommand: 'agda-mode:toggle-docking'
        }));
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { mountAt, settingsView, pending } = this.props;
        const { core } = this.props;
        const { handleMountAtPane, handleMountAtBottom, handleToggleSettingsView } = this.props;
        const spinnerClassList = classNames({
            pending
        }, 'loading loading-spinner-tiny inline-block');
        const settingsViewClassList = classNames({
            activated: settingsView,
        }, 'no-btn');
        const toggleMountingPosition = classNames({
            activated: mountAt.current === 0 /* Pane */
        }, 'no-btn');
        return (React.createElement("ul", { className: "agda-dashboard" },
            React.createElement("li", null,
                React.createElement("span", { id: "spinner", className: spinnerClassList })),
            React.createElement("li", null,
                React.createElement("button", { className: settingsViewClassList, onClick: () => {
                        handleToggleSettingsView();
                        if (settingsView) {
                            core.view.settingsTab.close();
                        }
                        else {
                            core.view.settingsTab.open();
                        }
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