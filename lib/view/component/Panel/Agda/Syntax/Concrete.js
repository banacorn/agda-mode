"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const util_1 = require("./../../../../../util");
const view_1 = require("../../../../../view");
var Link = require('./../../Body/Link.bs').jsComponent;
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
            return (React.createElement(view_1.default.EventContext.Consumer, null, emitter => React.createElement(Link, { jump: true, hover: true, emit: () => { } }, parts)));
        }
        else {
            return (React.createElement(view_1.default.EventContext.Consumer, null, emitter => React.createElement(Link, { jump: true, hover: true, emit: () => { } }, "_")));
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