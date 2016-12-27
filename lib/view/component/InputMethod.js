"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require("lodash");
var React = require("react");
var react_redux_1 = require("react-redux");
var classNames = require("classnames");
var CandidateSymbols_1 = require("./CandidateSymbols");
;
var mapStateToProps = function (state) {
    return state.inputMethod;
};
var InputMethod = (function (_super) {
    __extends(InputMethod, _super);
    function InputMethod() {
        return _super.apply(this, arguments) || this;
    }
    InputMethod.prototype.render = function () {
        var _a = this.props, activated = _a.activated, buffer = _a.buffer, translation = _a.translation, further = _a.further, keySuggestions = _a.keySuggestions, updateTranslation = _a.updateTranslation, insertCharacter = _a.insertCharacter, chooseSymbol = _a.chooseSymbol, candidateSymbols = _a.candidateSymbols;
        var hideEverything = classNames({ 'hidden': !activated }, 'agda-input-method');
        var hideBuffer = classNames({ 'hidden': _.isEmpty(buffer) }, 'inline-block', 'buffer');
        return (React.createElement("section", { className: hideEverything },
            React.createElement("div", { className: "keyboard" },
                React.createElement("div", { className: hideBuffer }, buffer),
                React.createElement("div", { className: "keys btn-group btn-group-sm" }, keySuggestions.map(function (key) { return React.createElement("button", { className: "btn", onClick: function () { return insertCharacter(key); }, key: key }, key); }))),
            React.createElement(CandidateSymbols_1.default, { updateTranslation: updateTranslation, chooseSymbol: chooseSymbol, candidates: candidateSymbols })));
    };
    return InputMethod;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, null)(InputMethod);
//# sourceMappingURL=InputMethod.js.map