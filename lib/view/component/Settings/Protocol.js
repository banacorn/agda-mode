"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const _ = require("lodash");
const classNames = require("classnames");
;
class Message extends React.Component {
    constructor() {
        super();
        this.state = {
            showParsed: false
        };
        this.toggleShowParsed = this.toggleShowParsed.bind(this);
    }
    toggleShowParsed() {
        this.setState({
            showParsed: !this.state.showParsed
        });
    }
    render() {
        const { kind, raw, parsed } = this.props.message;
        return (React.createElement("li", { onClick: this.toggleShowParsed },
            React.createElement("div", null, this.state.showParsed && parsed
                ? parsed
                : raw)));
    }
}
function mapStateToProps(state) {
    return {
        connection: _.find(state.connection.connectionInfos, {
            guid: state.connection.connected
        }),
        protocol: state.protocol
    };
}
class Protocol extends React.Component {
    constructor(props) {
        super(props);
        // this.state = {
        //     tabIndex: 0
        // };
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        const requests = this.props.protocol.messages.filter(msg => msg.kind === 'request');
        const responses = this.props.protocol.messages.filter(msg => msg.kind === 'response');
        const connInfo = this.props.connection;
        if (connInfo) {
            return (React.createElement("section", { className: classNames("agda-settings-protocol", this.props.className) },
                React.createElement("h2", null, "Protocol"),
                React.createElement("p", null,
                    "Current Protocol: ",
                    connInfo.languageServer ? 'LSP' : 'Vanilla'),
                React.createElement("h2", null, "Messages"),
                React.createElement("h3", null, "Requests"),
                React.createElement("ol", { className: "agda-settings-protocol-message-list" }, requests.map((msg, i) => React.createElement(Message, { message: msg, key: i }))),
                React.createElement("h3", null, "Responses"),
                React.createElement("ol", { className: "agda-settings-protocol-message-list" }, responses.map((msg, i) => React.createElement(Message, { message: msg, key: i })))));
        }
        else {
            return React.createElement("section", { className: classNames("agda-settings-protocol", this.props.className) },
                React.createElement("p", { className: 'background-message' }, "No Connections"));
        }
    }
}
// <p>
//     <span className='inline-block highlight'>from Agda</span>
//     <span className='inline-block info'>to Agda</span>
// </p>
// <section className="agda-settings-protocol-message-list">
//     <ol>{this.props.messages.map((msg, i) =>
//         <Message message={msg} key={i} />
//     )}</ol>
// </section>
exports.default = react_redux_1.connect(mapStateToProps, null)(Protocol);
//# sourceMappingURL=Protocol.js.map