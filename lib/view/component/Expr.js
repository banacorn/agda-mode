"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
const _ = require("lodash");
const React = require("react");
const actions_1 = require("../actions");
class Term extends React.Component {
    render() {
        const { jumpToGoal } = this.props;
        switch (this.props.kind) {
            case 'unmarked': return React.createElement("span", { className: "text-highlight" }, this.props.children);
            case 'goal': return React.createElement("button", { className: "no-btn text-info goal", onClick: () => {
                    const index = parseInt(this.props.children.toString().substr(1));
                    jumpToGoal(index);
                } }, this.props.children);
            case 'meta': return React.createElement("span", { className: "text-success meta" }, this.props.children);
            case 'sort': return React.createElement("span", { className: "text-warning sort" }, this.props.children);
        }
    }
}
class Expr extends React.Component {
    render() {
        const { emitter } = this.props;
        const otherProps = _.omit(this.props, 'jumpToGoal', 'emitter');
        let expressions;
        if (typeof this.props.children === 'string') {
            //                                         1       2                3
            const tokens = this.props.children.split(/(\?\d+)|(\_[^\.][^\}\)\s]*)|(Set \_\S+)/g);
            expressions = tokens.map((token, i) => {
                switch (i % 4) {
                    case 0: return {
                        kind: 'unmarked',
                        payload: token
                    };
                    case 1: return {
                        kind: 'goal',
                        payload: token
                    };
                    case 2: return {
                        kind: 'meta',
                        payload: token
                    };
                    case 3: return {
                        kind: 'sort',
                        payload: token
                    };
                }
            }).filter(token => !_.isEmpty(token.payload));
        }
        else {
            expressions = [];
        }
        return (React.createElement("span", __assign({ className: "expr" }, otherProps), expressions.map((expr, i) => React.createElement(Term, { kind: expr.kind, key: i, jumpToGoal: (index) => {
                emitter.emit(actions_1.EVENT.JUMP_TO_GOAL, index);
            } }, expr.payload))));
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Expr;
//# sourceMappingURL=Expr.js.map