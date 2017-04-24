"use strict";
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
        this.state = {
            showNewConnectionView: props.showNewConnectionView,
            method: 'local'
        };
        this.showNewConnectionView = this.showNewConnectionView.bind(this);
        this.hideNewConnectionView = this.hideNewConnectionView.bind(this);
        this.selectLocal = this.selectLocal.bind(this);
        this.selectRemote = this.selectRemote.bind(this);
    }
    showNewConnectionView() {
        this.setState({
            showNewConnectionView: true
        });
    }
    hideNewConnectionView() {
        this.setState({
            showNewConnectionView: false
        });
    }
    selectLocal() {
        this.setState({
            method: 'local'
        });
    }
    selectRemote() {
        this.setState({
            method: 'remote'
        });
    }
    render() {
        const { showNewConnectionView } = this.state;
        const mainClassList = classNames({
            hidden: showNewConnectionView
        });
        const newConnClassList = classNames({
            hidden: !showNewConnectionView
        });
        const disableLocal = this.state.method !== 'local';
        const disableRemote = this.state.method !== 'remote';
        return (React.createElement("section", { className: this.props.className },
            React.createElement("div", { className: mainClassList },
                React.createElement("header", null,
                    React.createElement("h2", null,
                        React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                    React.createElement("div", null,
                        React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.showNewConnectionView }, "new")))),
            React.createElement("div", { className: newConnClassList },
                React.createElement("header", null,
                    React.createElement("h2", null,
                        React.createElement("span", { className: "icon icon-plus" }, "New Connection")),
                    React.createElement("div", null,
                        React.createElement("button", { className: "btn icon icon-x inline-block-tight", onClick: this.hideNewConnectionView }, "cancel"))),
                React.createElement("section", null,
                    React.createElement("form", { id: "new-connection-dashboard" },
                        React.createElement("input", { id: "local-connection", className: 'input-radio', type: 'radio', name: 'connection-method', defaultChecked: true, onChange: this.selectLocal }),
                        React.createElement("label", { htmlFor: "local-connection" },
                            React.createElement("h3", null,
                                React.createElement("span", { className: "icon icon-home" }, "Local")),
                            React.createElement("p", null, "Establish connection to the Agda executable on your machine. The good old default."),
                            React.createElement("input", { className: 'input-text native-key-bindings', type: 'text', placeholder: 'path to Agda', disabled: disableLocal }),
                            React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", onClick: this.showNewConnectionView, disabled: disableLocal }, "connect")),
                        React.createElement("hr", null),
                        React.createElement("input", { id: "remote-connection", className: 'input-radio', type: 'radio', name: 'connection-method', onChange: this.selectRemote }),
                        React.createElement("label", { htmlFor: "remote-connection" },
                            React.createElement("h3", null,
                                React.createElement("span", { className: "icon icon-globe" }, "Remote")),
                            React.createElement("p", null, "Establish connection to some remote Agda process on this planet via TCP/IP"),
                            React.createElement("div", { id: "remote-connection-inputs" },
                                React.createElement("input", { id: "remote-connection-url", className: 'input-text native-key-bindings', type: 'text', placeholder: 'URL', disabled: disableRemote }),
                                React.createElement("input", { id: "remote-connection-port", className: 'input-text native-key-bindings', type: 'text', placeholder: 'port', defaultValue: "8192", disabled: disableRemote })),
                            React.createElement("button", { className: "btn icon btn-primary icon-zap inline-block-tight", onClick: this.showNewConnectionView, disabled: disableRemote }, "connect")))))));
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