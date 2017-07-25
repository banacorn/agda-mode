"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class Breadcrumb extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let tier1, tier2;
        switch (this.props.path) {
            case '/Connections':
                tier1 = React.createElement("li", null,
                    React.createElement("a", { href: "#" },
                        React.createElement("span", { className: "icon icon-plug" }, "Connections")));
                break;
            case '/Connections/New':
                tier1 = React.createElement("li", null,
                    React.createElement("a", { href: "#", onClick: this.props.navigate('/Connections') },
                        React.createElement("span", { className: "icon icon-plug" }, "Connections")));
                tier2 = React.createElement("li", null,
                    React.createElement("a", { href: "#" },
                        React.createElement("span", { className: "icon icon-plus" }, "New")));
                break;
            case '/Protocol':
                tier1 = React.createElement("li", null,
                    React.createElement("a", { href: "#" },
                        React.createElement("span", { className: "icon icon-comment-discussion" }, "Protocol")));
                break;
            default:
                tier1 = null;
                tier2 = null;
        }
        return (React.createElement("nav", { className: classNames('breadcrumb', this.props.className) },
            React.createElement("ol", { className: "breadcrumb" },
                React.createElement("li", null,
                    React.createElement("a", { id: "breadcrumb-settings", onClick: this.props.navigate('/'), href: "#" },
                        React.createElement("span", { className: "icon icon-settings" }, "Settings"))),
                tier1,
                tier2)));
    }
}
exports.default = Breadcrumb;
//# sourceMappingURL=Breadcrumb.js.map