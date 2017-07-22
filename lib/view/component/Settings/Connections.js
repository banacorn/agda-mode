"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
// import * as _ from 'lodash';
const classNames = require("classnames");
const NewConnection_1 = require("./NewConnection");
const ConnectionList_1 = require("./ConnectionList");
const mapStateToProps = ({ connection }) => connection;
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
        const { core } = this.props;
        const { showNewConnectionView } = this.state;
        return (React.createElement("div", { className: this.props.className },
            React.createElement(ConnectionList_1.default, { className: classNames({
                    hidden: showNewConnectionView
                }), onNew: this.toggleNewConnectionView(true), onSelect: (connInfo) => {
                    core.connector.select(connInfo);
                }, onSelectAndLoad: (connInfo) => {
                    core.connector.select(connInfo);
                    core.commander.activate({
                        kind: 'Load',
                    });
                }, onRemove: (connInfo) => {
                    core.connector.unselect(connInfo);
                } }),
            React.createElement(NewConnection_1.default, { core: this.props.core, className: classNames({
                    hidden: !showNewConnectionView
                }), onCancel: this.toggleNewConnectionView(false) })));
    }
}
// export default connect<View.ConnectionState, {}, Props>(
exports.default = react_redux_1.connect(mapStateToProps, null)(Connections);
//# sourceMappingURL=Connections.js.map