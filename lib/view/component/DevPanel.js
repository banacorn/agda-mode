"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var CompositeDisposable = require('atom').CompositeDisposable;
var mapStateToProps = function (state) { return ({}); };
var mapDispatchToProps = function (dispatch) { return ({}); };
var DevPanel = (function (_super) {
    __extends(DevPanel, _super);
    function DevPanel() {
        _super.call(this);
        this.subscriptions = new CompositeDisposable;
    }
    DevPanel.prototype.componentDidMount = function () {
        this.subscriptions.add(atom.tooltips.add(this.clearAllButton, {
            title: 'clear all messages',
            delay: 100
        }));
        // this.subscriptions.add(atom.tooltips.add(this.toggleDevViewButton, {
        //     title: 'toggle dev view (only available in dev mode)',
        //     delay: 100
        // }));
    };
    DevPanel.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    DevPanel.prototype.render = function () {
        var _this = this;
        // const { mountingPosition, devView } = this.props;
        // const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        // const { handleMountAtPane, handleMountAtBottom, handleToggleDevView } = this.props;
        // show dev view button only when in dev mode
        // const devViewClassList = classNames({
        //     activated: devView,
        //     hidden: !atom.inDevMode()
        // }, 'no-btn');
        // const toggleMountingPosition = classNames({
        //     activated: mountingPosition === View.MountingPosition.Pane
        // }, 'no-btn');
        return (React.createElement("ul", {className: "agda-dev-panel"}, 
            React.createElement("li", null, 
                React.createElement("button", {className: "no-btn", onClick: function () {
                }, ref: function (ref) {
                    _this.clearAllButton = ref;
                }}, 
                    React.createElement("span", {className: "icon icon-trashcan"})
                )
            )
        ));
    };
    return DevPanel;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(null, null)(DevPanel);
//# sourceMappingURL=DevPanel.js.map