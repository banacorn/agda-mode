"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
function ReqRes(props) {
    const { id, request, responses } = props.reqRes;
    return (React.createElement("li", { onClick: props.navigate({ path: '/Protocol/*', param: id }) },
        id,
        " : ",
        JSON.stringify(request.parsed.header.kind),
        "  ",
        React.createElement("span", { className: 'badge' }, responses.length)));
}
function Log(props) {
    return (React.createElement("section", { className: 'agda-settings-protocol-log' },
        React.createElement("ol", null, props.log.map((reqRes) => React.createElement(ReqRes, { key: reqRes.id, reqRes: reqRes, navigate: props.navigate })))));
}
exports.default = Log;
//# sourceMappingURL=Log.js.map