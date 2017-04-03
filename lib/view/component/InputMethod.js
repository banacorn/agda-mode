"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const CandidateSymbols_1 = require("./CandidateSymbols");
;
const mapStateToProps = (state) => {
    return state.inputMethod;
};
class InputMethod extends React.Component {
    render() {
        const { activated, buffer, translation, further, keySuggestions, updateTranslation, insertCharacter, chooseSymbol, candidateSymbols } = this.props;
        const hideEverything = classNames({ 'hidden': !activated }, 'input-method');
        const hideBuffer = classNames({ 'hidden': _.isEmpty(buffer) }, 'inline-block', 'buffer');
        return (React.createElement("section", { className: hideEverything },
            React.createElement("div", { className: "keyboard" },
                React.createElement("div", { className: hideBuffer }, buffer),
                React.createElement("div", { className: "keys btn-group btn-group-sm" }, keySuggestions.map(key => React.createElement("button", { className: "btn", onClick: () => insertCharacter(key), key: key }, key)))),
            React.createElement(CandidateSymbols_1.default, { updateTranslation: updateTranslation, chooseSymbol: chooseSymbol, candidates: candidateSymbols })));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(InputMethod);
//# sourceMappingURL=InputMethod.js.map