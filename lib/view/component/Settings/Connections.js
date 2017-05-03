"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const NewConnection_1 = require("./NewConnection");
const mapStateToProps = ({ connection }) => connection;
// const mapDispatchToProps = (dispatch) => ({
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
        return (React.createElement("div", { className: this.props.className },
            React.createElement("section", { className: mainClassList },
                React.createElement("header", null,
                    React.createElement("h2", null,
                        React.createElement("span", { className: "icon icon-plug" }, "Connections")),
                    React.createElement("div", null,
                        React.createElement("button", { className: "btn icon btn-primary icon-plus inline-block-tight", onClick: this.showNewConnectionView }, "new")))),
            React.createElement(NewConnection_1.default, { show: showNewConnectionView, onCancel: () => {
                    this.setState({
                        showNewConnectionView: false
                    });
                } })));
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