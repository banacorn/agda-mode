"use strict";
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../../actions");
var { CompositeDisposable } = require('atom');
const mapStateToProps = (state) => ({
    accumulate: state.dev.accumulate
});
const mapDispatchToProps = (dispatch) => ({
    clearAll: () => {
        dispatch(Action.devClearAll());
    },
    toogleAccumulate: () => {
        dispatch(Action.devToggleAccumulate());
    }
});
class DevPanel extends React.Component {
    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }
    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.clearAllButton, {
            title: 'clear all messages',
            delay: 100
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleAccumulateButton, {
            title: 'accumulate messages',
            delay: 100
        }));
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { accumulate } = this.props;
        const { clearAll, toogleAccumulate } = this.props;
        const toggleAccumulateClassList = classNames({
            activated: accumulate,
        }, 'no-btn');
        return (React.createElement("section", { className: "agda-dev-panel" },
            React.createElement("ul", { className: "button-groups" },
                React.createElement("li", null,
                    React.createElement("button", { className: toggleAccumulateClassList, onClick: toogleAccumulate, ref: (ref) => {
                            this.toggleAccumulateButton = ref;
                        } },
                        React.createElement("span", { className: "icon icon-inbox" })))),
            React.createElement("ul", { className: "button-groups" },
                React.createElement("li", null,
                    React.createElement("button", { className: "no-btn", onClick: clearAll, ref: (ref) => {
                            this.clearAllButton = ref;
                        } },
                        React.createElement("span", { className: "icon icon-trashcan" }))))));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(DevPanel);
//# sourceMappingURL=Panel.js.map