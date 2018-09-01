"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
////////////////////////////////////////////////////////////////////////////////
// Misc
exports.Comparison = (props) => props.value === 'CmpEq'
    ? React.createElement("span", null, "=")
    : React.createElement("span", null, "\u2264");
//# sourceMappingURL=TypeChecking.js.map