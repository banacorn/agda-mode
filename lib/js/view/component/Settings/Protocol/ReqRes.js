"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
const _ = require("lodash");
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
function ReqRes(props) {
    let reqRes = props.index !== undefined ? _.find(props.log, { id: props.index }) : undefined;
    if (reqRes) {
        const { request, responses } = reqRes;
        return (React.createElement("section", { className: classNames('agda-settings-protocol-reqres', props.className) },
            React.createElement("h3", null, "Request"),
            React.createElement("p", { className: 'agda-settings-protocol-request' }, request.raw),
            React.createElement("h3", null, "Responses"),
            React.createElement("ol", { className: 'agda-settings-protocol-responses' }, responses.map((res, i) => React.createElement(Response, { res: res, key: i })))));
    }
    else {
        return (React.createElement("section", { className: classNames('agda-settings-protocol-reqres', props.className) },
            React.createElement("p", { className: 'background-message' }, "Request Does Not Exist")));
    }
}
exports.default = ReqRes;
//# sourceMappingURL=ReqRes.js.map