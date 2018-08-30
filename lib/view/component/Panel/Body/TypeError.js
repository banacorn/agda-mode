"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const util_1 = require("./../../../../util");
const Range_1 = require("./Range");
const Syntax_1 = require("./Syntax");
function notInScope(error) {
    const suggest = (suggestions) => suggestions.length ? (React.createElement("span", null,
        " (did you mean ",
        util_1.intersperse(suggestions.map((name, i) => React.createElement(Syntax_1.QName, { key: i, names: name })), ', '),
        " ?)")) : null;
    const item = ({ name, suggestions }, i) => React.createElement("li", { key: i },
        React.createElement(Syntax_1.QName, { names: name }),
        suggest(suggestions));
    return React.createElement("section", null,
        "The following identifiers are not in scope: ",
        React.createElement("br", null),
        React.createElement("ul", null, error.payloads.map(item)));
}
function unequalTerms(error) {
    return React.createElement("section", null);
}
class TypeError extends React.Component {
    render() {
        const { error, range, emacsMessage } = this.props;
        console.log(emacsMessage);
        console.log(error);
        switch (error.kind) {
            case 'NotInScope': return React.createElement("div", { className: "error" },
                React.createElement(Range_1.default, { range: range }),
                React.createElement("br", null),
                notInScope(error));
            // case 'UnequalTerms': return <div className="error">
            //     <Range range={range} /><br/>
            //     {notInScope(error)}
            // </div>
            default: return React.createElement("p", { className: "error" }, emacsMessage);
        }
    }
}
exports.default = TypeError;
//# sourceMappingURL=TypeError.js.map