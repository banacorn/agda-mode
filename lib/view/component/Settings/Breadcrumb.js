"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class Breadcrumb extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let category;
        switch (this.props.path) {
            case 'Connections':
                category = React.createElement("li", null,
                    React.createElement("a", { href: "#" },
                        React.createElement("span", { className: "icon icon-plug" }, "Connections")));
                break;
            default:
                category = null;
        }
        return (React.createElement("nav", { className: classNames('breadcrumb', this.props.className) },
            React.createElement("ol", { className: "breadcrumb" },
                React.createElement("li", null,
                    React.createElement("a", { id: "breadcrumb-settings", onClick: this.props.back, href: "#" },
                        React.createElement("span", { className: "icon icon-settings" }, "Settings"))),
                category)));
    }
}
exports.default = Breadcrumb;
//# sourceMappingURL=Breadcrumb.js.map