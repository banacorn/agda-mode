"use strict";
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const actions_1 = require("../actions");
const Expr_1 = require("./Expr");
const Error_1 = require("./Error");
const Location_1 = require("./Location");
const mapStateToProps = (state) => {
    let obj = state.body;
    obj['mountAtBottom'] = state.view.mountAt.current === 1 /* Bottom */;
    return obj;
};
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
        const { emitter, banner, body, error, plainText, maxBodyHeight, mountAtBottom } = this.props;
        const classes = classNames(this.props.className, `native-key-bindings`, 'agda-body');
        const style = mountAtBottom ? {
            maxHeight: `${maxBodyHeight}px`
        } : {};
        return (React.createElement("section", { className: classes, tabIndex: -1, style: style },
            React.createElement("ul", { className: "list-group" }, banner.map((item, i) => React.createElement("li", { className: "list-item banner-item", key: i },
                React.createElement("div", { className: "item-heading text-info" }, item.label),
                React.createElement("div", { className: "item-colon" },
                    React.createElement("span", null, " : ")),
                React.createElement("div", { className: "item-body" },
                    React.createElement(Expr_1.default, { emitter: emitter }, item.type))))),
            React.createElement("ul", { className: "list-group" },
                body.goal.map((item, i) => React.createElement("li", { className: "list-item body-item", key: i },
                    React.createElement("div", { className: "item-heading" },
                        React.createElement("button", { className: "no-btn text-info", onClick: () => {
                                const index = parseInt(item.index.substr(1));
                                emitter.emit(actions_1.EVENT.JUMP_TO_GOAL, index);
                            } }, item.index)),
                    React.createElement("div", { className: "item-colon" },
                        React.createElement("span", null, " : ")),
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Expr_1.default, { emitter: emitter }, item.type)))),
                body.judgement.map((item, i) => React.createElement("li", { className: "list-item body-item", key: i },
                    React.createElement("div", { className: "item-heading" },
                        React.createElement("span", { className: "text-success" }, item.expr)),
                    React.createElement("div", { className: "item-colon" },
                        React.createElement("span", null, " : ")),
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Expr_1.default, { emitter: emitter }, item.type)))),
                body.term.map((item, i) => React.createElement("li", { className: "list-item body-item", key: i },
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Expr_1.default, { emitter: emitter }, item.expr)))),
                body.meta.map((item, i) => React.createElement("li", { className: "list-item body-item", key: i },
                    React.createElement("div", { className: "item-heading" },
                        React.createElement("span", { className: "text-success" }, item.index)),
                    React.createElement("div", { className: "item-colon" },
                        React.createElement("span", null, " : ")),
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Expr_1.default, { emitter: emitter }, item.type),
                        React.createElement(Location_1.default, { abbr: true, emitter: emitter }, item.location)))),
                body.sort.map((item, i) => React.createElement("li", { className: "list-item body-item", key: i },
                    React.createElement("div", { className: "item-heading" },
                        React.createElement("span", { className: "text-highlight" }, "Sort "),
                        React.createElement("span", { className: "text-warning" }, item.index)),
                    React.createElement("div", { className: "item-body" },
                        React.createElement(Location_1.default, { abbr: true, emitter: emitter }, item.location))))),
            error ? React.createElement(Error_1.default, { emitter: emitter }, error) : null,
            plainText ? React.createElement("p", null, plainText) : null));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Body);
//# sourceMappingURL=Body.js.map