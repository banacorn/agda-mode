"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const view_1 = require("../../../view");
const actions_1 = require("../../actions");
const Expr_1 = require("./Body/Expr");
const EmacsError_1 = require("./Body/EmacsError");
const Error_1 = require("./Agda/TypeChecking/Error");
const Solution_1 = require("./Body/Solution");
var Range = require('./Agda/Syntax/Position.bs').jsComponent;
function mapStateToProps(state) {
    return Object.assign({ mountAtBottom: state.view.mountAt.current === 1 /* Bottom */ }, state.body);
}
const mapDispatchToProps = (dispatch) => ({
    onMaxBodyHeightChange: (count) => {
        dispatch(actions_1.updateMaxBodyHeight(count));
    }
});
class Body extends React.Component {
    componentDidMount() {
        atom.config.observe('agda-mode.maxBodyHeight', (newHeight) => {
            this.props.onMaxBodyHeightChange(newHeight);
        });
    }
    render() {
        const { body, solutions, error, emacsMessage, emacsError, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        return (React.createElement("section", { className: classes, tabIndex: -1, style: style },
            React.createElement("ul", { className: "list-group" }, body.goalAndHave.map(goalAndHave)),
            React.createElement("ul", { className: "list-group" },
                body.goals.map(goal),
                body.judgements.map(judgement),
                body.terms.map(term),
                body.metas.map(meta),
                body.sorts.map(sort)),
            React.createElement("ul", { className: "list-group" },
                body.warnings.length > 0 &&
                    React.createElement("li", { className: "list-item special-item" }, body.warnings.join('\n')),
                body.errors.length > 0 &&
                    React.createElement("li", { className: "list-item special-item" }, body.errors.join('\n'))),
            solutions.message &&
                React.createElement(Solution_1.default, { solutions: solutions }),
            error && React.createElement(Error_1.default, { error: error, emacsMessage: emacsMessage }),
            emacsError && React.createElement(EmacsError_1.default, null, emacsError),
            plainText && React.createElement("p", null, plainText)));
    }
}
const goalAndHave = (item, i) => React.createElement("li", { className: "list-item special-item", key: i },
    React.createElement("div", { className: "item-heading text-info" }, item.label),
    React.createElement("div", { className: "item-colon" },
        React.createElement("span", null, " : ")),
    React.createElement("div", { className: "item-body" },
        React.createElement(Expr_1.default, null, item.type)));
const goal = (item, i) => React.createElement("li", { className: "list-item body-item", key: i },
    React.createElement("div", { className: "item-heading" },
        React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement("button", { className: "no-btn text-info", onClick: () => {
                const index = parseInt(item.index.substr(1));
                emitter.emit(actions_1.EVENT.JUMP_TO_GOAL, index);
            } }, item.index)))),
    React.createElement("div", { className: "item-colon" },
        React.createElement("span", null, " : ")),
    React.createElement("div", { className: "item-body" },
        React.createElement(Expr_1.default, null, item.type)));
const judgement = (item, i) => React.createElement("li", { className: "list-item body-item", key: i },
    React.createElement("div", { className: "item-heading" },
        React.createElement("span", { className: "text-success" }, item.expr)),
    React.createElement("div", { className: "item-colon" },
        React.createElement("span", null, " : ")),
    React.createElement("div", { className: "item-body" },
        React.createElement(Expr_1.default, null, item.type)));
const term = (item, i) => React.createElement("li", { className: "list-item body-item", key: i },
    React.createElement("div", { className: "item-body" },
        React.createElement(Expr_1.default, null, item.expr)));
const meta = (item, i) => React.createElement("li", { className: "list-item body-item", key: i },
    React.createElement("div", { className: "item-heading" },
        React.createElement("span", { className: "text-success" }, item.index)),
    React.createElement("div", { className: "item-colon" },
        React.createElement("span", null, " : ")),
    React.createElement("div", { className: "item-body" },
        React.createElement(Expr_1.default, null, item.type),
        React.createElement(Range, { abbr: true, range: item.range })));
const sort = (item, i) => React.createElement("li", { className: "list-item body-item", key: i },
    React.createElement("div", { className: "item-heading" },
        React.createElement("span", { className: "text-highlight" }, "Sort "),
        React.createElement("span", { className: "text-warning" }, item.index)),
    React.createElement("div", { className: "item-body" },
        React.createElement(Range, { abbr: true, range: item.range })));
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
//# sourceMappingURL=Body.js.map