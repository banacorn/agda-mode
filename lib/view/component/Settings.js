"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var classNames = require('classnames');
var types_1 = require('../../types');
var mapStateToProps = function (state) { return ({
    mountingPosition: state.view.mountAt
}); };
var Settings = (function (_super) {
    __extends(Settings, _super);
    function Settings() {
        _super.apply(this, arguments);
    }
    Settings.prototype.render = function () {
        var mountingPosition = this.props.mountingPosition;
        var toggleMountingPosition = classNames({
            activated: mountingPosition === types_1.View.MountingPoint.Pane
        }, 'no-btn');
        return (React.createElement("ul", {className: "agda-settings"}, 
            React.createElement("li", null, 
                React.createElement("button", {className: toggleMountingPosition}, 
                    React.createElement("span", {className: "icon icon-versions"})
                )
            )
        ));
    };
    return Settings;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(null, null)(Settings);
//# sourceMappingURL=Settings.js.map