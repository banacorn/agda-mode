"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const actions_1 = require("../../../actions");
// Atom shits
const atom_1 = require("atom");
class Range extends React.Component {
    constructor(props) {
        super(props);
        this.subscriptions = new atom_1.CompositeDisposable;
    }
    componentDidMount() {
        if (this.props.abbr) {
            this.subscriptions.add(atom.tooltips.add(this.link, {
                title: JSON.stringify(this.props.range),
                delay: {
                    show: 0,
                    hide: 1000
                }
            }));
        }
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { emitter, range, abbr } = this.props;
        if (abbr) {
            return (React.createElement("span", { className: "text-subtle range icon icon-link", onClick: () => {
                    emitter.emit(actions_1.EVENT.JUMP_TO_RANGE, range);
                }, ref: (ref) => {
                    this.link = ref;
                } }));
        }
        else {
            return (React.createElement("span", { className: "text-subtle range icon icon-link", onClick: () => {
                    emitter.emit(actions_1.EVENT.JUMP_TO_RANGE, range);
                } },
                " ",
                range.toString()));
        }
    }
}
exports.default = Range;
//# sourceMappingURL=Range.js.map