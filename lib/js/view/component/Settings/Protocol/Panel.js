"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
function ProtocolPanel(props) {
    function handleLogLimit(event) {
        props.handleLogLimit(event.target.checked);
    }
    return (React.createElement("section", { className: 'agda-settings-protocol-panel' },
        React.createElement("label", { className: 'input-label' },
            React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: handleLogLimit, checked: props.limitLog }),
            " Keep only the last 10 requests")));
}
exports.default = ProtocolPanel;
//# sourceMappingURL=Panel.js.map