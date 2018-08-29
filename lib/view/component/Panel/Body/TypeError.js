"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Range_1 = require("./Range");
const Syntax_1 = require("./Syntax");
function notInScope(error) {
    return React.createElement("section", null,
        "The following identifiers are not in scope: ",
        React.createElement("br", null),
        React.createElement("ul", null, error.payloads.map(({ name, range, suggestions }, i) => React.createElement("li", { key: i },
            React.createElement(Syntax_1.QName, { names: name }),
            JSON.stringify(name),
            " ",
            JSON.stringify(range),
            " ",
            JSON.stringify(suggestions)))));
}
class TypeError extends React.Component {
    render() {
        const { error, range, emacsMessage } = this.props;
        switch (error.kind) {
            case 'NotInScope': return React.createElement("div", { className: "error" },
                React.createElement(Range_1.default, { range: range }),
                React.createElement("br", null),
                notInScope(error));
            default: return React.createElement("p", { className: "error" }, emacsMessage);
        }
    }
}
exports.default = TypeError;
//# sourceMappingURL=TypeError.js.map