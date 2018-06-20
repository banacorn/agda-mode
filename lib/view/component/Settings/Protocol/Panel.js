"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class ProtocolPanel extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const className = classNames(this.props.className, 'agda-settings-protocol-panel');
        return (React.createElement("section", { className: className },
            React.createElement("div", null, "Normal size"),
            React.createElement("div", { className: 'btn-group' },
                React.createElement("button", { className: 'btn' }, "One"),
                React.createElement("button", { className: 'btn' }, "Two"),
                React.createElement("button", { className: 'btn' }, "Three"))));
    }
}
exports.default = ProtocolPanel;
//# sourceMappingURL=Panel.js.map