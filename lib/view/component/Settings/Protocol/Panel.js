"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const classNames = require("classnames");
const Action = require("../../../actions");
function mapDispatchToProps(dispatch) {
    return {
        limitLog: (shouldLimitLog) => {
            dispatch(Action.PROTOCOL.limitLog(shouldLimitLog));
        },
    };
}
function mapStateToProps(state) {
    return {
        protocol: state.protocol
    };
}
class ProtocolPanel extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const className = classNames(this.props.className, 'agda-settings-protocol-panel');
        return (React.createElement("section", { className: className },
            React.createElement("label", { className: 'input-label' },
                React.createElement("input", { className: 'input-toggle', type: 'checkbox', onChange: this.handleLogLimit }),
                " Keep only the last 10 requests")));
    }
    handleLogLimit(event) {
        this.props.limitLog(event.target.checked);
    }
}
exports.default = react_redux_1.connect(mapStateToProps, mapDispatchToProps)(ProtocolPanel);
//# sourceMappingURL=Panel.js.map