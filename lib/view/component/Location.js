"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const actions_1 = require("../actions");
var { CompositeDisposable } = require('atom');
class Location extends React.Component {
    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
        this.locationPath = '';
    }
    componentWillMount() {
        this.location = this.props.children;
        // concatenating Location path
        if (this.location.path)
            this.locationPath += `${this.location.path}:`;
        if (this.location.isSameLine)
            this.locationPath += `${this.location.range.start.row + 1},${this.location.range.start.column + 1}-${this.location.range.end.column + 1}`;
        else
            this.locationPath += `${this.location.range.start.row + 1},${this.location.range.start.column + 1}-${this.location.range.end.row + 1},${this.location.range.end.column + 1}`;
    }
    componentDidMount() {
        if (this.props.abbr) {
            this.subscriptions.add(atom.tooltips.add(this.locationLink, {
                title: this.locationPath,
                delay: 0
            }));
        }
    }
    componentWillUnmount() {
        this.subscriptions.dispose();
    }
    render() {
        const { emitter, abbr } = this.props;
        if (abbr) {
            return (React.createElement("span", { className: "text-subtle location icon icon-link", onClick: () => {
                    emitter.emit(actions_1.EVENT.JUMP_TO_LOCATION, this.location);
                }, ref: (ref) => {
                    this.locationLink = ref;
                } }));
        }
        else {
            return (React.createElement("span", { className: "text-subtle location icon icon-link", onClick: () => {
                    emitter.emit(actions_1.EVENT.JUMP_TO_LOCATION, this.location);
                } },
                " ",
                this.locationPath));
        }
    }
}
exports.default = Location;
//# sourceMappingURL=Location.js.map