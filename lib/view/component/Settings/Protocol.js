"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const _ = require("lodash");
const classNames = require("classnames");
;
class Response extends React.Component {
    constructor() {
        super();
    }
    render() {
        const { raw, parsed } = this.props.res;
        return (React.createElement("li", null, JSON.stringify(parsed)));
    }
}
;
class ReqRes extends React.Component {
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
        // const { kind, raw, parsed } = this.props.message;
        // return (
        //     <li onClick={this.toggleShowParsed}>
        //         <div>{this.state.showParsed && parsed
        //             ?   JSON.stringify(parsed)
        //             :   raw
        //         }</div>
        //     </li>
        // )
        const { request, responses } = this.props.reqRes;
        return (React.createElement("li", null,
            React.createElement("h3", null, "Request"),
            React.createElement("p", null, JSON.stringify(request.raw)),
            React.createElement("h3", null, "Responses"),
            React.createElement("ol", { className: "agda-settings-protocol-responses" }, responses.map((res, i) => React.createElement(Response, { res: res, key: i })))));
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
    }
    render() {
        const connInfo = this.props.connection;
        if (connInfo) {
            return (React.createElement("section", { className: classNames("agda-settings-protocol", this.props.className) },
                React.createElement("h2", null, "Protocol"),
                React.createElement("p", null,
                    "Current Protocol: ",
                    connInfo.languageServer ? 'LSP' : 'Vanilla'),
                React.createElement("h2", null, "Log"),
                React.createElement("ol", { className: "agda-settings-protocol-log" }, this.props.protocol.log.map((reqRes, i) => React.createElement(ReqRes, { reqRes: reqRes, key: i })))));
        }
        else {
            return React.createElement("section", { className: classNames("agda-settings-protocol", this.props.className) },
                React.createElement("p", { className: 'background-message' }, "No Connections"));
        }
    }
}
// <h2>Messages</h2>
// <h3>Requests</h3>
// <ol className="agda-settings-protocol-message-list">{requests.map((msg, i) =>
//     <Message message={msg} key={i} />
// )}</ol>
// <h3>Responses</h3>
// <ol className="agda-settings-protocol-message-list">{responses.map((msg, i) =>
//     <Message message={msg} key={i} />
// )}</ol>
exports.default = react_redux_1.connect(mapStateToProps, null)(Protocol);
//# sourceMappingURL=Protocol.js.map