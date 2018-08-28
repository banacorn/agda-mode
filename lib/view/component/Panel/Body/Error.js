"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const TypeError_1 = require("./TypeError");
class Error extends React.Component {
    render() {
        const { emitter, error } = this.props;
        switch (error.kind) {
            case 'TypeError': return React.createElement(TypeError_1.default, { emitter: emitter, error: error.typeError });
            case 'Exception': return React.createElement("p", { className: "error" },
                JSON.stringify(error.range),
                React.createElement("br", null));
            case 'IOException': return React.createElement("p", { className: "error" },
                JSON.stringify(error.range),
                React.createElement("br", null));
            case 'PatternError': return React.createElement("p", { className: "error" }, "Pattern violation (you shouldn't see this)");
        }
        //     case 'BadConstructor': return <p className="error">
        //             <Location emitter={emitter}>{error.location}</Location><br/>
        //             The constructor <Expr emitter={emitter}>{error.constructor}</Expr><br/>
        //             does not construct an element of <Expr emitter={emitter}>{error.constructorType}</Expr><br/>
        //             when checking that the expression <Expr emitter={emitter}>{error.expr}</Expr><br/>
        //             has type <Expr emitter={emitter}>{error.exprType}</Expr>
        //     </p>
    }
}
exports.default = Error;
//# sourceMappingURL=Error.js.map