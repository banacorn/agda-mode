"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const classNames = require("classnames");
class Breadcrumb extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        // hide the whole thing when not navigating the pages
        const hideBreadcrumb = classNames({
            'hidden': this.props.path === 'Nothing'
        });
        return (React.createElement("nav", { className: hideBreadcrumb },
            React.createElement("p", null,
                "Settings > ",
                this.props.path)));
    }
}
exports.default = Breadcrumb;
//# sourceMappingURL=Breadcrumb.js.map