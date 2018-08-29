"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Range_1 = require("./Range");
function notInScope(emitter, error) {
    return React.createElement("section", null,
        "The following identifiers are not in scope: ",
        React.createElement("br", null),
        React.createElement("ul", null, error.payloads.map(({ name, range, suggestions }, i) => React.createElement("li", { key: i },
            JSON.stringify(name),
            " ",
            JSON.stringify(range),
            " ",
            JSON.stringify(suggestions)))));
}
class TypeError extends React.Component {
    render() {
        const { emitter, error, range, emacsMessage } = this.props;
        switch (error.kind) {
            case 'NotInScope': return React.createElement("div", { className: "error" },
                React.createElement(Range_1.default, { emitter: emitter, range: range }),
                React.createElement("br", null),
                notInScope(emitter, error));
            default: return React.createElement("p", { className: "error" }, emacsMessage);
        }
    }
}
exports.default = TypeError;
//# sourceMappingURL=TypeError.js.map