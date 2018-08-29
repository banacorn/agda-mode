"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const actions_1 = require("../../../actions");
// Atom shits
const atom_1 = require("atom");
const view_1 = require("../../../../view");
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
        return React.createElement(view_1.default.EventContext.Consumer, null, emitter => {
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
                    Range.toString(range)));
            }
        });
    }
}
exports.default = Range;
//# sourceMappingURL=Range.js.map