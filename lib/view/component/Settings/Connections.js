"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
// import * as _ from 'lodash';
const classNames = require("classnames");
const NewConnection_1 = require("./NewConnection");
const ConnectionList_1 = require("./ConnectionList");
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
    }
    toggleNewConnectionView(show) {
        return () => {
            this.setState({
                showNewConnectionView: show
            });
        };
    }
    render() {
        const { showNewConnectionView } = this.state;
        return (React.createElement("div", { className: this.props.className },
            React.createElement(ConnectionList_1.default, { className: classNames({
                    hidden: showNewConnectionView
                }), onNew: this.toggleNewConnectionView(true) }),
            React.createElement(NewConnection_1.default, { core: this.props.core, className: classNames({
                    hidden: !showNewConnectionView
                }), onCancel: this.toggleNewConnectionView(false) })));
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