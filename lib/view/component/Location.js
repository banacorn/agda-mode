"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var actions_1 = require('../actions');
var CompositeDisposable = require('atom').CompositeDisposable;
var mapDispatchToProps = function (dispatch) { return ({
    jumpToLocation: function (loc) {
        dispatch(actions_1.jumpToLocation(loc));
    }
}); };
var Location = (function (_super) {
    __extends(Location, _super);
    function Location() {
        _super.call(this);
        this.subscriptions = new CompositeDisposable;
        this.locationPath = '';
    }
    Location.prototype.componentDidMount = function () {
        this.subscriptions.add(atom.tooltips.add(this.locationLink, {
            title: this.locationPath,
            delay: 0
        }));
    };
    Location.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    Location.prototype.render = function () {
        var _this = this;
        var location = this.props.children;
        var jumpToLocation = this.props.jumpToLocation;
        if (location.path)
            this.locationPath += location.path + ":";
        if (location.isSameLine)
            this.locationPath += (location.range.start.row + 1) + "," + (location.range.start.column + 1) + "-" + (location.range.end.column + 1);
        else
            this.locationPath += (location.range.start.row + 1) + "," + (location.range.start.column + 1) + "-" + (location.range.end.row + 1) + "," + (location.range.end.column + 1);
        return (React.createElement("span", {className: "text-subtle location icon icon-link", onClick: function () {
            jumpToLocation(location);
        }, ref: function (ref) {
            _this.locationLink = ref;
        }}));
    };
    return Location;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(null, mapDispatchToProps)(Location);
//# sourceMappingURL=Location.js.map