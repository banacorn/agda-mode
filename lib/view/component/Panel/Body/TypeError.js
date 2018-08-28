"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Range_1 = require("./Range");
function notInScope(emitter, error) {
    return React.createElement("p", { className: "error" },
        React.createElement(Range_1.default, { emitter: emitter, range: error.payloads[0].range }),
        React.createElement("br", null),
        JSON.stringify(error.payloads),
        React.createElement("br", null));
}
class TypeError extends React.Component {
    render() {
        console.log(this.props.error);
        const { emitter, error } = this.props;
        switch (error.kind) {
            case 'NotInScope': return notInScope(emitter, error);
            default: return React.createElement("p", { className: "error" },
                "Unhandled Error: ",
                React.createElement("br", null),
                JSON.stringify(error));
        }
    }
}
exports.default = TypeError;
//# sourceMappingURL=TypeError.js.map