"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var react_redux_1 = require("react-redux");
var classNames = require("classnames");
var Action = require("../actions");
var CompositeDisposable = require('atom').CompositeDisposable;
var mapStateToProps = function (state) { return ({
    mountingPosition: state.view.mountAt.current,
    devView: state.view.devView
}); };
var mapDispatchToProps = function (dispatch) { return ({
    handleMountAtPane: function () {
        dispatch(Action.mountAtPane());
    },
    handleMountAtBottom: function () {
        dispatch(Action.mountAtBottom());
    },
    handleToggleDevView: function () {
        dispatch(Action.toggleDevView());
    }
}); };
var Settings = (function (_super) {
    __extends(Settings, _super);
    function Settings() {
        var _this = _super.call(this) || this;
        _this.subscriptions = new CompositeDisposable;
        return _this;
    }
    Settings.prototype.componentDidMount = function () {
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: 300,
            keyBindingCommand: 'agda-mode:toggle-docking'
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleDevViewButton, {
            title: 'toggle dev view (only available in dev mode)',
            delay: 100
        }));
    };
    Settings.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    Settings.prototype.render = function () {
        var _this = this;
        var _a = this.props, mountingPosition = _a.mountingPosition, devView = _a.devView;
        var _b = this.props, mountAtPane = _b.mountAtPane, mountAtBottom = _b.mountAtBottom, toggleDevView = _b.toggleDevView;
        var _c = this.props, handleMountAtPane = _c.handleMountAtPane, handleMountAtBottom = _c.handleMountAtBottom, handleToggleDevView = _c.handleToggleDevView;
        // show dev view button only when in dev mode
        var devViewClassList = classNames({
            activated: devView,
            hidden: !atom.inDevMode()
        }, 'no-btn');
        var toggleMountingPosition = classNames({
            activated: mountingPosition === 0 /* Pane */
        }, 'no-btn');
        return (React.createElement("ul", { className: "agda-settings" },
            React.createElement("li", null,
                React.createElement("button", { className: devViewClassList, onClick: function () {
                        handleToggleDevView();
                        toggleDevView();
                    }, ref: function (ref) {
                        _this.toggleDevViewButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-tools" }))),
            React.createElement("li", null,
                React.createElement("button", { className: toggleMountingPosition, onClick: function () {
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
                    }, ref: function (ref) {
                        _this.toggleMountingPositionButton = ref;
                    } },
                    React.createElement("span", { className: "icon icon-versions" })))));
    };
    return Settings;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Settings);
//# sourceMappingURL=Settings.js.map