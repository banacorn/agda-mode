"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class Breadcrumb extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (React.createElement("nav", { className: this.props.className },
            React.createElement("p", null,
                React.createElement("a", { onClick: this.props.back }, "Settings"),
                " > ",
                this.props.path)));
    }
}
exports.default = Breadcrumb;
//# sourceMappingURL=Breadcrumb.js.map