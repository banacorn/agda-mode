"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../../actions");
var { CompositeDisposable } = require('atom');
const mapStateToProps = (state) => ({
    accumulate: state.dev.accumulate,
    lsp: state.dev.lsp
});
const mapDispatchToProps = (dispatch) => ({
    clearAll: () => {
        dispatch(Action.devClearAll());
    },
    toogleAccumulate: () => {
        dispatch(Action.devToggleAccumulate());
    },
    toggleLSP: () => {
        dispatch(Action.devToggleLSP());
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
        this.subscriptions.add(atom.tooltips.add(this.toggleLSPButton, {
            title: 'language protocol server',
            delay: 100
        }));
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { accumulate, lsp } = this.props;
        const { clearAll, toogleAccumulate, toggleLSP } = this.props;
        const clearAllButtonClassList = classNames({
            hidden: lsp
        }, 'btn');
        const toggleAccumulateClassList = classNames({
            selected: accumulate,
            hidden: lsp
        }, 'btn');
        const toggleLSPClassList = classNames({
            selected: lsp,
        }, 'btn');
        return (React.createElement("section", { className: "agda-dev-panel" },
            React.createElement("div", { className: "btn-group" },
                React.createElement("button", { className: clearAllButtonClassList, onClick: clearAll, ref: (ref) => {
                        this.clearAllButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-trashcan" })),
                React.createElement("button", { className: toggleAccumulateClassList, onClick: toogleAccumulate, ref: (ref) => {
                        this.toggleAccumulateButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-inbox" }))),
            React.createElement("div", { className: "btn-group" },
                React.createElement("button", { className: toggleLSPClassList, onClick: toggleLSP, ref: (ref) => {
                        this.toggleLSPButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-radio-tower" }),
                    React.createElement("span", { className: "button-label" }, "LSP")))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(DevPanel);
//# sourceMappingURL=Panel.js.map