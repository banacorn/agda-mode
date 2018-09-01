"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../../actions");
const Panel_1 = require("./Protocol/Panel");
const Log_1 = require("./Protocol/Log");
function mapDispatchToProps(dispatch) {
    return {
        limitLog: (shouldLimitLog) => {
            dispatch(Action.PROTOCOL.limitLog(shouldLimitLog));
        },
        navigate: (uri) => () => {
            dispatch(Action.VIEW.navigate(uri));
        }
    };
}
function mapStateToProps(state) {
    return {
        agda: state.connection.agda,
        protocol: state.protocol
    };
}
class Protocol extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("section", { className: classNames('agda-settings-protocol', this.props.className) },
            React.createElement(Panel_1.default, { limitLog: this.props.protocol.limitLog, handleLogLimit: this.props.limitLog }),
            React.createElement(Log_1.default, { log: this.props.protocol.log, navigate: this.props.navigate })));
        // if (this.props.agda) {
        //     return (
        //         <section className={classNames('agda-settings-protocol', this.props.className)}>
        //             <h2>Protocol</h2>
        //             <p><span className='text-highlight'>Agda Version: </span>{this.props.agda.version.raw}</p>
        //             <p><span className='text-highlight'>Agda Location: </span>{this.props.agda.path}</p>
        //             <p><span className='text-highlight'>Current Protocol: </span>{this.props.languageServer ? 'LSP' : 'Vanilla'}</p>
        //             <h2>Log</h2>
        //         </section>
        //     )
        // } else {
        //     return (
        //         <section className={classNames('agda-settings-protocol', this.props.className)}>
        //             <p className='background-message'>
        //                 No Connection Established
        //             </p>
        //         </section>svedkacitron
        //     )
        // }
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(Protocol);
//# sourceMappingURL=Protocol.js.map