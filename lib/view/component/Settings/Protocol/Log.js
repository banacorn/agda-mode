"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class Log extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const className = classNames(this.props.className, 'agda-settings-protocol-log');
        return (React.createElement("section", { className: className }, "123123123"));
    }
}
exports.default = Log;
//# sourceMappingURL=Log.js.map