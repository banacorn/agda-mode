"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
function Log(props) {
    return (React.createElement("section", { className: 'agda-settings-protocol-log' },
        React.createElement("ol", null, props.log.map((reqRes, i) => React.createElement("li", { className: 'agda-settings-protocol-log-item', key: i }, JSON.stringify(reqRes.request))))));
}
exports.default = Log;
//# sourceMappingURL=Log.js.map