"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const React = require("react");
const Expr_1 = require("./Expr");
class Suggestion extends React.Component {
    render() {
        const lines = this.props.children;
        switch (lines.length) {
            case 0: return null;
            case 1: return React.createElement("span", null,
                "Did you mean: ",
                React.createElement(Expr_1.default, null, lines[0]),
                " ?");
            default:
                const otherSuggestions = _.tail(lines).map((line, i) => {
                    return (React.createElement("span", { key: i },
                        React.createElement("br", null),
                        "           or ",
                        React.createElement(Expr_1.default, null, line)));
                });
                return React.createElement("span", null,
                    "Did you mean: ",
                    React.createElement(Expr_1.default, null, _.head(lines)),
                    otherSuggestions,
                    " ?");
        }
    }
}
exports.default = Suggestion;
//# sourceMappingURL=Suggestion.js.map