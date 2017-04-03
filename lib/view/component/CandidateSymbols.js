"use strict";
const _ = require("lodash");
const React = require("react");
var { CompositeDisposable } = require('atom');
;
class CandidateSymbols extends React.Component {
    constructor() {
        super();
        this.state = {
            index: 0
        };
    }
    // lifecycle hook, subscribes to Atom's core events here
    componentDidMount() {
        const commands = {
            'core:move-up': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.max([
                        0,
                        this.state.index - 10
                    ]);
                    this.setState({ index: newIndex });
                    this.props.updateTranslation(this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-right': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.min([
                        this.props.candidates.length - 1,
                        this.state.index + 1
                    ]);
                    this.setState({ index: newIndex });
                    this.props.updateTranslation(this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-down': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.min([
                        this.props.candidates.length - 1,
                        this.state.index + 10
                    ]);
                    this.setState({ index: newIndex });
                    this.props.updateTranslation(this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            },
            'core:move-left': (event) => {
                if (!_.isEmpty(this.props.candidates)) {
                    const newIndex = _.max([
                        0,
                        this.state.index - 1
                    ]);
                    this.setState({ index: newIndex });
                    this.props.updateTranslation(this.props.candidates[newIndex]);
                    event.stopImmediatePropagation();
                }
            }
        };
        this.subscriptions = atom.commands.add('atom-text-editor.agda-mode-input-method-activated', commands);
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { candidates, chooseSymbol } = this.props;
        const start = Math.floor(this.state.index / 10) * 10;
        const position = this.state.index % 10;
        const frameLeft = candidates.slice(start, this.state.index);
        const frameRight = candidates.slice(this.state.index + 1, start + 10);
        const selected = candidates[this.state.index];
        if (candidates.length > 0)
            return (React.createElement("div", { className: "candidates btn-group btn-group-sm" },
                frameLeft.map(key => React.createElement("button", { className: "btn", onClick: () => { chooseSymbol(key); }, key: key }, key)),
                React.createElement("button", { className: "btn selected", onClick: () => { chooseSymbol(selected); }, key: selected }, selected),
                frameRight.map(key => React.createElement("button", { className: "btn", onClick: () => { chooseSymbol(key); }, key: key }, key))));
        else
            return null;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = CandidateSymbols;
//# sourceMappingURL=CandidateSymbols.js.map