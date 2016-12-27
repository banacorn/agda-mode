"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var React = require("react");
var CompositeDisposable = require('atom').CompositeDisposable;
;
var CandidateSymbols = (function (_super) {
    __extends(CandidateSymbols, _super);
    function CandidateSymbols() {
        var _this = _super.call(this) || this;
        _this.state = {
            index: 0
        };
        return _this;
    }
    // lifecycle hook, subscribes to Atom's core events here
    CandidateSymbols.prototype.componentDidMount = function () {
        var _this = this;
        var commands = {
            'core:move-up': function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    var newIndex = _.max([
                        0,
                        _this.state.index - 10
                    ]);
                    _this.setState({ index: newIndex });
                    _this.props.updateTranslation(_this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-right': function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    var newIndex = _.min([
                        _this.props.candidates.length - 1,
                        _this.state.index + 1
                    ]);
                    _this.setState({ index: newIndex });
                    _this.props.updateTranslation(_this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-down': function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    var newIndex = _.min([
                        _this.props.candidates.length - 1,
                        _this.state.index + 10
                    ]);
                    _this.setState({ index: newIndex });
                    _this.props.updateTranslation(_this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-left': function (event) {
                if (!_.isEmpty(_this.props.candidates)) {
                    var newIndex = _.max([
                        0,
                        _this.state.index - 1
                    ]);
                    _this.setState({ index: newIndex });
                    _this.props.updateTranslation(_this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            }
        };
        this.subscriptions = atom.commands.add('atom-text-editor.agda-mode-input-method-activated', commands);
    };
    CandidateSymbols.prototype.componentWillUnmount = function () {
        this.subscriptions.dispose();
    };
    CandidateSymbols.prototype.render = function () {
        var _a = this.props, candidates = _a.candidates, chooseSymbol = _a.chooseSymbol;
        var start = Math.floor(this.state.index / 10) * 10;
        var position = this.state.index % 10;
        var frameLeft = candidates.slice(start, this.state.index);
        var frameRight = candidates.slice(this.state.index + 1, start + 10);
        var selected = candidates[this.state.index];
        if (candidates.length > 0)
            return (React.createElement("div", { className: "candidates btn-group btn-group-sm" },
                frameLeft.map(function (key) { return React.createElement("button", { className: "btn", onClick: function () { chooseSymbol(key); }, key: key }, key); }),
                React.createElement("button", { className: "btn selected", onClick: function () { chooseSymbol(selected); }, key: selected }, selected),
                frameRight.map(function (key) { return React.createElement("button", { className: "btn", onClick: function () { chooseSymbol(key); }, key: key }, key); })));
        else
            return null;
    };
    return CandidateSymbols;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CandidateSymbols;
//# sourceMappingURL=CandidateSymbols.js.map