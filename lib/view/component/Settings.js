"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var classNames = require('classnames');
var Action = require('../actions');
var CompositeDisposable = require('atom').CompositeDisposable;
var mapStateToProps = function (state) { return ({
    mountingPosition: state.view.mountAt.current
}); };
var mapDispatchToProps = function (dispatch) { return ({
    handleMountAtPane: function () {
        dispatch(Action.mountAtPane());
    },
    handleMountAtBottom: function () {
        dispatch(Action.mountAtBottom());
    }
}); };
var Settings = (function (_super) {
    __extends(Settings, _super);
    function Settings() {
        _super.call(this);
        this.subscriptions = new CompositeDisposable;
    }
    Settings.prototype.componentDidMount = function () {
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: 300
        }));
    };
    Settings.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    Settings.prototype.render = function () {
        var _this = this;
        var mountingPosition = this.props.mountingPosition;
        var _a = this.props, mountAtPane = _a.mountAtPane, mountAtBottom = _a.mountAtBottom;
        var _b = this.props, handleMountAtPane = _b.handleMountAtPane, handleMountAtBottom = _b.handleMountAtBottom;
        var toggleMountingPosition = classNames({
            activated: mountingPosition === 0 /* Pane */
        }, 'no-btn');
        return (React.createElement("ul", {className: "agda-settings"}, 
            React.createElement("li", null, 
                React.createElement("button", {className: toggleMountingPosition, onClick: function () {
                    switch (mountingPosition) {
                        case 1 /* Bottom */:
                            console.log('from bottom');
                            handleMountAtPane();
                            mountAtPane();
                            break;
                        case 0 /* Pane */:
                            console.log('from pane');
                            handleMountAtBottom();
                            mountAtBottom();
                            break;
                        default:
                            console.error('no mounting position to transist from');
                    }
                }, ref: function (ref) {
                    _this.toggleMountingPositionButton = ref;
                }}, 
                    React.createElement("span", {className: "icon icon-versions"})
                )
            )
        ));
    };
    return Settings;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Settings);
//# sourceMappingURL=Settings.js.map