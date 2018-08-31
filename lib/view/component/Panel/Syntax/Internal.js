"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const Concrete_1 = require("./Concrete");
;
class Term extends React.Component {
    render() {
        const { value } = this.props;
        switch (value.kind) {
            case 'Def':
                return React.createElement("span", { className: 'syntax term' },
                    React.createElement(Concrete_1.Name, { value: value.name.name.concrete }));
            case 'Sort':
                return React.createElement("span", { className: 'syntax term' },
                    React.createElement(Sort, { value: value.sort }));
            default:
                return React.createElement("span", { className: 'syntax term' }, JSON.stringify(value));
        }
    }
}
exports.Term = Term;
;
class Type extends React.Component {
    render() {
        const { value } = this.props;
        return React.createElement(Term, { value: value.payload });
    }
}
exports.Type = Type;
;
// TODO: everything
class Sort extends React.Component {
    render() {
        const { value } = this.props;
        switch (value.kind) {
            case 'Type':
                return React.createElement("span", { className: 'syntax sort' }, "Set");
            default:
                return React.createElement("span", { className: 'syntax sort' }, value.kind);
        }
    }
}
exports.Sort = Sort;
//# sourceMappingURL=Internal.js.map