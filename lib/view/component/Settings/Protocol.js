"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const _ = require("lodash");
const classNames = require("classnames");
const Panel_1 = require("./Protocol/Panel");
const Log_1 = require("./Protocol/Log");
;
class Response extends React.Component {
    constructor(props) {
        super(props);
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
    constructor(props) {
        super(props);
    }
    render() {
        const { request, responses } = this.props.reqRes;
        return (React.createElement("li", null,
            React.createElement("h3", null, "Request"),
            React.createElement("p", { className: 'agda-settings-protocol-request' }, request.raw),
            React.createElement("h3", null, "Responses"),
            React.createElement("ol", { className: 'agda-settings-protocol-responses' }, responses.map((res, i) => React.createElement(Response, { res: res, key: i })))));
    }
}
function mapStateToProps(state) {
    return {
        agda: state.connection.agda,
        languageServer: state.connection.languageServer,
        protocol: state.protocol
    };
}
class Protocol extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("section", { className: classNames('agda-settings-protocol', this.props.className) },
            React.createElement(Panel_1.default, null),
            React.createElement(Log_1.default, null)));
        // if (this.props.agda) {
        //     return (
        //         <section className={classNames('agda-settings-protocol', this.props.className)}>
        //             <h2>Protocol</h2>
        //             <p><span className='text-highlight'>Agda Version: </span>{this.props.agda.version.raw}</p>
        //             <p><span className='text-highlight'>Agda Location: </span>{this.props.agda.path}</p>
        //             <p><span className='text-highlight'>Current Protocol: </span>{this.props.languageServer ? 'LSP' : 'Vanilla'}</p>
        //             <h2>Log</h2>
        //             <ol className='agda-settings-protocol-log'>{this.props.protocol.log.map((reqRes, i) =>
        //                 <ReqRes reqRes={reqRes} key={i} />
        //             )}</ol>
        //         </section>
        //     )
        // } else {
        //     return (
        //         <section className={classNames('agda-settings-protocol', this.props.className)}>
        //             <p className='background-message'>
        //                 No Connection Established
        //             </p>
        //         </section>
        //     )
        // }
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Protocol);
//# sourceMappingURL=Protocol.js.map