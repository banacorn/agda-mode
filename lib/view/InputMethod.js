"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
var classNames = require('classnames');
;
var mapStateToProps = function (state) {
    return state.inputMethod;
};
var InputMethod = (function (_super) {
    __extends(InputMethod, _super);
    function InputMethod() {
        _super.apply(this, arguments);
    }
    InputMethod.prototype.render = function () {
        var _a = this.props, activate = _a.activate, keySuggestion = _a.keySuggestion;
        var hidden = classNames({ 'hidden': !activate });
        return (React.createElement("section", {className: hidden}, 
            React.createElement("h1", null, "Hey"), 
            keySuggestion.map(function (key) { return React.createElement("span", {key: key}, key); })));
    };
    return InputMethod;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(InputMethod);
//# sourceMappingURL=InputMethod.js.map