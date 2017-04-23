"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const mapStateToProps = ({ connection }) => connection;
// const mapDispatchToProps = (dispatch: any) => ({
//     handleNewConnection: () => {
//         dispatch(Action.mountAtPane());
//     }
// });
class Connections extends React.Component {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // <button className='btn btn-error icon icon-trashcan inline-block-tight'>Delete</button>
        const _a = this.props, { dispatch, connections, setupView, current } = _a, props = __rest(_a, ["dispatch", "connections", "setupView", "current"]);
        const currentConnectionClassList = classNames('current-connection', {});
        const setupConnectionClassList = classNames('setup-connection', {
            hidden: !setupView
        });
        // const currentConnection =
        // const previousConnections = connections.map((conn, i) =>
        //     <li key={conn.guid}>
        //         <ConnectionItem
        //             connected={false}
        //             version={conn.version.raw}
        //             uri={conn.uri}
        //         />
        //     </li>
        // );
        // <section className={setupConnectionClassList}>
        //     <h2><span className="icon icon-plus">Set up New Connection</span></h2>
        //     <input className='input-text' type='text' placeholder='the location of Agda'/>
        //     <div>
        //         <button className="btn icon icon-trashcan inline-block-tight">cancel</button>
        //         <button className="btn icon btn-primary icon-plug inline-block-tight">connect</button>
        //     </div>
        // </section>
        return (React.createElement("section", Object.assign({}, props),
            React.createElement("header", null,
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                React.createElement("div", null,
                    React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight" }, "new")))));
    }
}
// export default connect<View.ConnectionState, {}, Props>(
exports.default = react_redux_1.connect(mapStateToProps)(Connections);
// <section {...props}>
//     <section className={currentConnectionClassList}>
//         <h2><span className="icon icon-plug">Current Connection</span></h2>
//         { current ?
//             <ConnectionItem
//                 status="connected"
//                 version="Agda-2.5.2"
//                 uri="path/to/agda"
//             /> :
//             <div className="no-connection">
//                 <span className="icon icon-stop">no connection established</span>
//             </div>
//         }
//     </section>
//     <section className="previous-connections">
//         <h2><span className="icon icon-repo">Previous Connections</span></h2>
//         <p>
//             A list of previously established connections to Agda
//         </p>
//         <ol>
//             <li>
//                 <ConnectionItem
//                     status="connecting"
//                     version="Agda-2.6-2ade23"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="connected"
//                     version="Agda-2.6"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="disconnected"
//                     version="Agda-2.6"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="disconnected"
//                     version="Agda-2.5.2"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="disconnected"
//                     version="Agda-2.5.2"
//                     uri="path/to/agda"
//                 />
//             </li>
//         </ol>
//     </section>
// </section>
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.3.2"
//         uri="path/to/agda"
//     />
// </li>
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.3.2"
//         uri="path/to/agda"
//     />
// </li>
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.5"
//         uri="path/to/agda"
//     />
// </li>
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.3.2"
//         uri="path/to/agda"
//     />
// </li>
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.3.2"
//         uri="path/to/agda"
//     />
// </li>
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.3.2"
//         uri="path/to/agda"
//     />
// </li>
//# sourceMappingURL=Connections.js.map