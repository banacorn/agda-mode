"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const actions_1 = require("../../../actions");
const view_1 = require("../../../../view");
const Expr_1 = require("./Expr");
class Solution extends React.Component {
    render() {
        const s = this.props.solutions;
        if (s.kind === 'SimpleSolutions') {
            return (React.createElement("section", null,
                React.createElement("p", null, s.message),
                React.createElement("ul", { className: "list-group" }, s.solutions.map(({ index, expr }, i) => React.createElement("li", { className: "list-item", key: i },
                    React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement("button", { className: "no-btn icon icon-check check-solutions text-subtle", onClick: () => {
                            emitter.emit(actions_1.EVENT.FILL_IN_SIMPLE_SOLUTION, expr);
                        } }))),
                    React.createElement("div", { className: "item-heading text-subtle" },
                        index,
                        "."),
                    React.createElement("div", { className: "item-cell" },
                        React.createElement(Expr_1.default, null, expr)))))));
        }
        else {
            return (React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement("section", null,
                React.createElement("p", null, s.message),
                React.createElement("ul", { className: "list-group" }, s.solutions.map(({ index, combination }, i) => React.createElement("li", { className: "list-item", key: i },
                    React.createElement("button", { className: "no-btn icon icon-check check-solutions text-subtle", onClick: () => {
                            emitter.emit(actions_1.EVENT.FILL_IN_INDEXED_SOLUTIONS, combination);
                        } }),
                    React.createElement("div", { className: "item-heading text-subtle" },
                        index,
                        "."),
                    combination.map((solution, i) => React.createElement("div", { className: "item-cell", key: i },
                        React.createElement("button", { className: "no-btn text-info goal", onClick: () => {
                                emitter.emit(actions_1.EVENT.JUMP_TO_GOAL, solution.goalIndex);
                            } },
                            "?",
                            solution.goalIndex),
                        React.createElement("div", { className: "item-colon" },
                            React.createElement("span", null, " : ")),
                        React.createElement(Expr_1.default, null, solution.expr))))))))));
        }
    }
}
exports.default = Solution;
//# sourceMappingURL=Solution.js.map