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
const ConnectionItem_1 = require("./ConnectionItem");
const mapStateToProps = (state) => {
    return state.connection;
};
class Connections extends React.Component {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // <button className='btn btn-error icon icon-trashcan inline-block-tight'>Delete</button>
        const _a = this.props, { dispatch, connections } = _a, props = __rest(_a, ["dispatch", "connections"]);
        // console.log(connections);
        const previousConnections = connections.map((conn, i) => React.createElement("li", { key: i.toString() },
            React.createElement(ConnectionItem_1.default, { connected: false, version: conn.version.raw, uri: conn.uri })));
        return (React.createElement("section", Object.assign({}, props),
            React.createElement("section", { className: "current-connection" },
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-plug" }, "Current Connection")),
                React.createElement(ConnectionItem_1.default, { connected: true, version: "Agda-2.5.2", uri: "path/to/agda" })),
            React.createElement("section", { className: "previous-connections" },
                React.createElement("h2", null,
                    React.createElement("span", { className: "icon icon-repo" }, "Previous Connections")),
                React.createElement("p", null, "A list of previously established connections to Agda"),
                React.createElement("ol", null, previousConnections))));
    }
}
exports.default = react_redux_1.connect(mapStateToProps)(Connections);
// <li>
//     <ConnectionItem
//         connected={false}
//         version="Agda-2.6"
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