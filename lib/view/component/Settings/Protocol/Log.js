"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
// interface ReqResProp extends React.HTMLProps<HTMLElement> {
//     reqRes: View.ReqRes
// };
//
// class ReqRes extends React.Component<ReqResProp, {}> {
//     constructor(props: ReqResProp) {
//         super(props)
//     }
//
//     render() {
//         const { request, responses } = this.props.reqRes;
//         return (
//             <li>
//                 <h3>Request</h3>
//                 <p className='agda-settings-protocol-request'>{request.raw}</p>
//                 <h3>Responses</h3>
//                 <ol className='agda-settings-protocol-responses'>{responses.map((res, i) =>
//                     <Response res={res} key={i}/>
//                 )}</ol>
//             </li>
//         )
//     }
// }
function ReqRes(props) {
    const { id, request, responses } = props.reqRes;
    return (React.createElement("li", { className: 'agda-settings-protocol-log-item' },
        id,
        " : ",
        JSON.stringify(request.parsed.header.kind)));
}
function Log(props) {
    return (React.createElement("section", { className: 'agda-settings-protocol-log' },
        React.createElement("ol", null, props.log.map((reqRes, i) => React.createElement(ReqRes, { key: reqRes.id, reqRes: reqRes })))));
}
exports.default = Log;
//# sourceMappingURL=Log.js.map