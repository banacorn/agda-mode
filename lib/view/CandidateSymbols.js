"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require('lodash');
var React = require('react');
var react_redux_1 = require('react-redux');
var CompositeDisposable = require("atom").CompositeDisposable;
;
var mapStateToProps = function (state) { return ({
    candidates: state.inputMethod.candidateSymbols
}); };
var CandidateSymbols = (function (_super) {
    __extends(CandidateSymbols, _super);
    function CandidateSymbols() {
        _super.apply(this, arguments);
    }
    CandidateSymbols.prototype.componentDidMount = function () {
        var _this = this;
        console.log("mount");
        var commands = {
            "core:move-up": function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    console.log("up");
                    event.stopImmediatePropagation();
                }
            },
            "core:move-right": function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    console.log("right");
                    event.stopImmediatePropagation();
                }
            },
            "core:move-down": function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    console.log("down");
                    event.stopImmediatePropagation();
                }
            },
            "core:move-left": function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    console.log("left");
                    event.stopImmediatePropagation();
                }
            }
        };
        this.subscriptions = atom.commands.add("atom-text-editor.agda-mode-input-method-activated", commands);
    };
    CandidateSymbols.prototype.render = function () {
        var candidates = this.props.candidates;
        return (React.createElement("div", {id: "candidate-symbols", className: "btn-group btn-group-sm"}, candidates.map(function (key) { return React.createElement("button", {className: "btn", key: key}, key); })));
    };
    return CandidateSymbols;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(CandidateSymbols);
//# sourceMappingURL=CandidateSymbols.js.map