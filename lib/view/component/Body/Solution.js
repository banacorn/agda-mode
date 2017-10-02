"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
// import { updateMaxBodyHeight, EVENT } from '../actions';
const Expr_1 = require("./../Expr");
class Solution extends React.Component {
    render() {
        // console.log(this.props.children)
        // console.log(this.props)
        const s = this.props.solutions;
        if (s.kind === 'SimpleSolutions') {
            return (React.createElement("section", null,
                React.createElement("p", null, s.message),
                React.createElement("ul", { className: "list-group" }, s.solutions.map(({ index, expr }, i) => React.createElement("li", { className: "list-item body-item", key: i },
                    React.createElement("div", { className: "item-heading text-success" }, index),
                    React.createElement("div", { className: "item-colon" },
                        React.createElement("span", null, " ")),
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Expr_1.default, { emitter: this.props.emitter }, expr)))))));
        }
        else {
            return (React.createElement("section", null,
                React.createElement("p", null, s.message),
                React.createElement("ul", { className: "list-group" }, s.solutions.map(({ index, combination }, i) => React.createElement("li", { className: "list-item special-item", key: i },
                    React.createElement("div", { className: "item-heading text-info" }, index),
                    React.createElement("div", { className: "item-colon" },
                        React.createElement("span", null, " ")),
                    React.createElement("div", { className: "item-body" }, JSON.stringify(combination)))))));
        }
    }
}
exports.default = Solution;
//# sourceMappingURL=Solution.js.map