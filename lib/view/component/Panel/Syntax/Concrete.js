"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const util_1 = require("./../../../../util");
const Link_1 = require("../Body/Link");
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
        const { value } = this.props;
        if (value.kind === "Name") {
            const parts = value.parts.map(x => x || '_').join('');
            return React.createElement(Link_1.default, { jump: true, hover: true, range: value.range }, parts);
        }
        else {
            return React.createElement(Link_1.default, { jump: true, hover: true, range: value.range }, "_");
        }
    }
}
exports.Name = Name;
;
class QName extends React.Component {
    render() {
        const { value } = this.props;
        const filtered = value
            .filter(x => !Name.isUnderscore(x));
        return React.createElement("span", { className: 'syntax qname' }, util_1.intersperse(filtered.map((name, i) => React.createElement(Name, { value: name, key: i })), '.'));
    }
}
exports.QName = QName;
//# sourceMappingURL=Concrete.js.map