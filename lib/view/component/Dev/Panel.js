"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var react_redux_1 = require("react-redux");
var classNames = require("classnames");
var Action = require("../../actions");
var CompositeDisposable = require('atom').CompositeDisposable;
var mapStateToProps = function (state) { return ({
    accumulate: state.dev.accumulate
}); };
var mapDispatchToProps = function (dispatch) { return ({
    clearAll: function () {
        dispatch(Action.devClearAll());
    },
    toogleAccumulate: function () {
        dispatch(Action.devToggleAccumulate());
    }
}); };
var DevPanel = (function (_super) {
    __extends(DevPanel, _super);
    function DevPanel() {
        var _this = _super.call(this) || this;
        _this.subscriptions = new CompositeDisposable;
        return _this;
    }
    DevPanel.prototype.componentDidMount = function () {
        this.subscriptions.add(atom.tooltips.add(this.clearAllButton, {
            title: 'clear all messages',
            delay: 100
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleAccumulateButton, {
            title: 'accumulate messages',
            delay: 100
        }));
    };
    DevPanel.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    DevPanel.prototype.render = function () {
        var _this = this;
        var accumulate = this.props.accumulate;
        var _a = this.props, clearAll = _a.clearAll, toogleAccumulate = _a.toogleAccumulate;
        var toggleAccumulateClassList = classNames({
            activated: accumulate,
        }, 'no-btn');
        return (React.createElement("section", { className: "agda-dev-panel" },
            React.createElement("ul", { className: "button-groups" },
                React.createElement("li", null,
                    React.createElement("button", { className: toggleAccumulateClassList, onClick: toogleAccumulate, ref: function (ref) {
                            _this.toggleAccumulateButton = ref;
                        } },
                        React.createElement("span", { className: "icon icon-inbox" })))),
            React.createElement("ul", { className: "button-groups" },
                React.createElement("li", null,
                    React.createElement("button", { className: "no-btn", onClick: clearAll, ref: function (ref) {
                            _this.clearAllButton = ref;
                        } },
                        React.createElement("span", { className: "icon icon-trashcan" }))))));
    };
    return DevPanel;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(DevPanel);
//# sourceMappingURL=Panel.js.map