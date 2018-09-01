"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
// Atom shits
const atom_1 = require("atom");
const Atom = require("atom");
const view_1 = require("../../../../../view");
var Link = require('./../../Body/Link.bs').jsComponent;
class Range extends React.Component {
    constructor(props) {
        super(props);
        this.subscriptions = new atom_1.CompositeDisposable;
    }
    static toString(range) {
        const lineNums = range.intervals.map((interval) => {
            if (interval.start[0] === interval.end[0])
                return `${interval.start[0]},${interval.start[1]}-${interval.end[1]}`;
            else
                return `${interval.start[0]},${interval.start[1]}-${interval.end[0]},${interval.end[1]}`;
        }).join(' ');
        if (range.source && lineNums) {
            return `${range.source}:${lineNums}`;
        }
        if (range.source && lineNums === '') {
            return `${range.source}`;
        }
        if (range.source === null) {
            return `${lineNums}`;
        }
    }
    static toAtomRanges(range) {
        return range.intervals.map(({ start, end }) => new Atom.Range(new Atom.Point(start[0] - 1, start[1] - 1), new Atom.Point(end[0] - 1, end[1] - 1)));
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
        const { range, abbr } = this.props;
        if (abbr) {
            return (React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(Link, { jump: true, emit: () => { } },
                React.createElement("span", { className: "text-subtle range icon icon-link", ref: (ref) => {
                        this.link = ref;
                    } })))));
        }
        else {
            return (React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement(Link, { jump: true, emit: () => { } },
                React.createElement("span", { className: "text-subtle range icon icon-link" }, Range.toString(range))))));
        }
    }
}
exports.Range = Range;
//# sourceMappingURL=Position.js.map