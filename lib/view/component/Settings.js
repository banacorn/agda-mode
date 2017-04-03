"use strict";
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../actions");
var { CompositeDisposable } = require('atom');
const mapStateToProps = (state) => ({
    mountingPosition: state.view.mountAt.current,
    devView: state.view.devView
});
const mapDispatchToProps = (dispatch) => ({
    handleMountAtPane: () => {
        dispatch(Action.mountAtPane());
    },
    handleMountAtBottom: () => {
        dispatch(Action.mountAtBottom());
    },
    handleToggleDevView: () => {
        dispatch(Action.toggleDevView());
    }
});
class Settings extends React.Component {
    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }
    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: 300,
            keyBindingCommand: 'agda-mode:toggle-docking'
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleDevViewButton, {
            title: 'toggle dev view (only available in dev mode)',
            delay: 100
        }));
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { mountingPosition, devView } = this.props;
        const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        const { handleMountAtPane, handleMountAtBottom, handleToggleDevView } = this.props;
        // show dev view button only when in dev mode
        const devViewClassList = classNames({
            activated: devView,
            hidden: !atom.inDevMode()
        }, 'no-btn');
        const toggleMountingPosition = classNames({
            activated: mountingPosition === 0 /* Pane */
        }, 'no-btn');
        return (React.createElement("ul", { className: "agda-settings" },
            React.createElement("li", null,
                React.createElement("button", { className: devViewClassList, onClick: () => {
                        handleToggleDevView();
                        toggleDevView();
                    }, ref: (ref) => {
                        this.toggleDevViewButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-tools" }))),
            React.createElement("li", null,
                React.createElement("button", { className: toggleMountingPosition, onClick: () => {
                        switch (mountingPosition) {
                            case 1 /* Bottom */:
                                handleMountAtPane();
                                mountAtPane();
                                break;
                            case 0 /* Pane */:
                                handleMountAtBottom();
                                mountAtBottom();
                                break;
                            default:
                                console.error('no mounting position to transist from');
                        }
                    }, ref: (ref) => {
                        this.toggleMountingPositionButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-versions" })))));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Settings);
//# sourceMappingURL=Settings.js.map