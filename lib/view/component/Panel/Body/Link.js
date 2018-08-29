"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const actions_1 = require("../../../actions");
const view_1 = require("../../../../view");
class Link extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        const { range } = this.props;
        return React.createElement(view_1.default.EventContext.Consumer, null, emitter => (React.createElement("span", { onClick: () => { emitter.emit(actions_1.EVENT.JUMP_TO_RANGE, range); }, onMouseOver: () => { emitter.emit(actions_1.EVENT.MOUSE_OVER, range); }, onMouseOut: () => { emitter.emit(actions_1.EVENT.MOUSE_OUT, range); } }, this.props.children)));
    }
}
exports.default = Link;
//# sourceMappingURL=Link.js.map