"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const util_1 = require("./../../../../../util");
const Concrete_1 = require("../Syntax/Concrete");
const Internal_1 = require("../Syntax/Internal");
var Range = require('./../Syntax/Position.bs').jsComponent;
function notInScope(error) {
    const suggest = (suggestions) => suggestions.length ? (React.createElement("span", null,
        " (did you mean ",
        util_1.intersperse(suggestions.map((name, i) => React.createElement(Concrete_1.QName, { key: i, value: name })), ', '),
        " ?)")) : null;
    const item = ({ name, suggestions }, i) => React.createElement("li", { key: i },
        React.createElement(Concrete_1.QName, { value: name }),
        suggest(suggestions));
    return React.createElement("section", null,
        "The following identifiers are not in scope: ",
        React.createElement("br", null),
        React.createElement("ul", null, error.payloads.map(item)));
}
function unequalTerms(error) {
    return React.createElement("section", null,
        'expected : ',
        React.createElement(Internal_1.Term, { value: error.term2 }),
        React.createElement("br", null),
        '  actual : ',
        React.createElement(Internal_1.Term, { value: error.term1 }),
        React.createElement("br", null),
        ' of type : ',
        React.createElement(Internal_1.Type, { value: error.type }),
        React.createElement("br", null),
        "when checking that the expression");
}
class TypeError extends React.Component {
    render() {
        const { error, range, emacsMessage } = this.props;
        console.log(emacsMessage);
        console.log(error);
        switch (error.kind) {
            case 'NotInScope': return React.createElement("div", { className: "error" },
                React.createElement(Range, { range: range }),
                React.createElement("br", null),
                notInScope(error));
            case 'UnequalTerms': return React.createElement("div", { className: "error" },
                React.createElement(Range, { range: range }),
                React.createElement("br", null),
                unequalTerms(error));
            default: return React.createElement("p", { className: "error" }, emacsMessage);
        }
    }
}
exports.default = TypeError;
//# sourceMappingURL=TypeError.js.map