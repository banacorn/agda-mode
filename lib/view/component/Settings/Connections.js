"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
// import * as _ from 'lodash';
const classNames = require("classnames");
const ConnectionList_1 = require("./ConnectionList");
const Action = require("../../actions");
const mapStateToProps = ({ connection }) => connection;
function mapDispatchToProps(dispatch) {
    return {
        navigate: (path) => () => {
            dispatch(Action.SETTINGS.navigate(path));
        }
    };
}
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
                }), onNew: this.props.navigate('/Connections/New'), onSelect: (connInfo) => {
                    core.connector.select(connInfo);
                }, onSelectAndLoad: (connInfo) => {
                    core.connector.select(connInfo);
                    core.commander.activate({
                        kind: 'Load',
                    });
                }, onRemove: (connInfo) => {
                    core.connector.unselect(connInfo);
                } })));
    }
}
// export default connect<View.ConnectionState, {}, Props>(
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Connections);
// <NewConnection
//     core={this.props.core}
//     className={classNames({
//         hidden: !showNewConnectionView
//     })}
//     onCancel={this.toggleNewConnectionView(false)}
// />
//# sourceMappingURL=Connections.js.map