"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const util_1 = require("./../../../../util");
const Link_1 = require("./Link");
;
class Name extends React.Component {
    static isUnderscore(name) {
        if (name.kind === 'Name') {
            if (name.parts.length === 1 && name.parts[0]) {
                return name.parts[0] === '_';
            }
            else {
                return false;
            }
        }
        else {
            return true;
        }
    }
    render() {
        const { name } = this.props;
        if (name.kind === "Name") {
            const parts = name.parts.map(x => x || '_').join('');
            return React.createElement(Link_1.default, { jump: true, hover: true, range: name.range }, parts);
        }
        else {
            return React.createElement(Link_1.default, { jump: true, hover: true, range: name.range }, "_");
        }
    }
}
exports.Name = Name;
;
class QName extends React.Component {
    render() {
        const { names } = this.props;
        const filtered = names
            .filter(x => !Name.isUnderscore(x));
        return React.createElement("span", { className: 'syntax qname' }, util_1.intersperse(filtered.map((name, i) => React.createElement(Name, { name: name, key: i })), '.'));
    }
}
exports.QName = QName;
//# sourceMappingURL=Syntax.js.map