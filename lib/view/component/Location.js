"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var actions_1 = require("../actions");
var CompositeDisposable = require('atom').CompositeDisposable;
var Location = (function (_super) {
    __extends(Location, _super);
    function Location() {
        var _this = _super.call(this) || this;
        _this.subscriptions = new CompositeDisposable;
        _this.locationPath = '';
        return _this;
    }
    Location.prototype.componentWillMount = function () {
        this.location = this.props.children;
        // concatenating Location path
        if (this.location.path)
            this.locationPath += this.location.path + ":";
        if (this.location.isSameLine)
            this.locationPath += this.location.range.start.row + 1 + "," + (this.location.range.start.column + 1) + "-" + (this.location.range.end.column + 1);
        else
            this.locationPath += this.location.range.start.row + 1 + "," + (this.location.range.start.column + 1) + "-" + (this.location.range.end.row + 1) + "," + (this.location.range.end.column + 1);
    };
    Location.prototype.componentDidMount = function () {
        if (this.props.abbr) {
            this.subscriptions.add(atom.tooltips.add(this.locationLink, {
                title: this.locationPath,
                delay: 0
            }));
        }
    };
    Location.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    Location.prototype.render = function () {
        var _this = this;
        var _a = this.props, emitter = _a.emitter, abbr = _a.abbr;
        if (abbr) {
            return (React.createElement("span", { className: "text-subtle location icon icon-link", onClick: function () {
                    emitter.emit(actions_1.EVENT.JUMP_TO_LOCATION, _this.location);
                }, ref: function (ref) {
                    _this.locationLink = ref;
                } }));
        }
        else {
            return (React.createElement("span", { className: "text-subtle location icon icon-link", onClick: function () {
                    emitter.emit(actions_1.EVENT.JUMP_TO_LOCATION, _this.location);
                } },
                " ",
                this.locationPath));
        }
    };
    return Location;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Location;
//# sourceMappingURL=Location.js.map