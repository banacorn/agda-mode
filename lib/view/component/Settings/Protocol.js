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
        this.state = {
            showRaw: false,
            fold: false
        };
        this.toggleShowRaw = this.toggleShowRaw.bind(this);
        this.toggleFold = this.toggleFold.bind(this);
    }
    toggleShowRaw() {
        this.setState({
            showRaw: !this.state.showRaw
        });
    }
    toggleFold() {
        this.setState({
            fold: !this.state.fold
        });
    }
    componentWillMount() {
        // keep 'HighlightingInfo_Direct' folded by default
        this.setState({
            fold: this.state.fold || _.includes([
                'HighlightingInfo_Direct'
            ], this.props.res.parsed.kind)
        });
    }
    render() {
        const { raw, parsed } = this.props.res;
        const pairs = _.toPairs(_.omit(parsed, 'kind'));
        return (React.createElement("li", null,
            React.createElement("button", { className: 'no-btn inline-block highlight', onClick: this.toggleShowRaw }, parsed.kind),
            React.createElement("button", { className: `no-btn icon icon-${this.state.fold ? 'unfold' : 'fold'}`, onClick: this.toggleFold }),
            !this.state.fold &&
                (this.state.showRaw ?
                    React.createElement("dl", null, raw)
                    :
                        pairs.map((pair, i) => (React.createElement("dl", { key: i },
                            React.createElement("dt", null, pair[0]),
                            React.createElement("dd", null, JSON.stringify(pair[1]))))))));
    }
}
;
class ReqRes extends React.Component {
    constructor() {
        super();
    }
    render() {
        const { request, responses } = this.props.reqRes;
        return (React.createElement("li", null,
            React.createElement("h3", null, "Request"),
            React.createElement("p", { className: "agda-settings-protocol-request" }, request.raw),
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
                    React.createElement("span", { className: "text-highlight" }, "Agda Version: "),
                    connInfo.agda.version.raw),
                React.createElement("p", null,
                    React.createElement("span", { className: "text-highlight" }, "Agda Location: "),
                    connInfo.agda.location),
                React.createElement("p", null,
                    React.createElement("span", { className: "text-highlight" }, "Current Protocol: "),
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