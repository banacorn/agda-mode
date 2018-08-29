"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
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
            return React.createElement("span", null, parts);
        }
        else {
            return React.createElement("span", null, "_");
        }
        return React.createElement("span", null, ":D");
    }
}
exports.Name = Name;
;
// WTF
function intersperse(array, sep) {
    if (array.length === 0) {
        return [];
    }
    return array.slice(1).reduce(function (xs, x) {
        return xs.concat([sep, x]);
    }, [array[0]]);
}
class QName extends React.Component {
    render() {
        const { names } = this.props;
        const filtered = names
            .filter(x => !Name.isUnderscore(x));
        return React.createElement("span", null, intersperse(filtered.map((name, i) => React.createElement(Name, { name: name, key: i })), '.'));
    }
}
exports.QName = QName;
//# sourceMappingURL=Syntax.js.map