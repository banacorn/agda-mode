"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
const react_redux_1 = require("react-redux");
const _ = require("lodash");
const classNames = require("classnames");
const Settings_1 = require("./Settings");
function toStyle(type) {
    switch (type) {
        case 3 /* Error */: return 'error';
        case 4 /* Warning */: return 'warning';
        case 1 /* Info */: return 'info';
        case 2 /* Success */: return 'success';
        case 0 /* PlainText */: return 'plain-text';
        default: return '';
    }
}
const mapStateToProps = (state) => {
    return {
        text: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated
    };
};
class Header extends React.Component {
    render() {
        const { text, style, inputMethodActivated } = this.props;
        const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        const classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, 'agda-header');
        return (React.createElement("div", { className: classes },
            React.createElement("h1", { className: `text-${toStyle(style)}` }, text),
            React.createElement(Settings_1.default, { mountAtPane: mountAtPane, mountAtBottom: mountAtBottom, toggleDevView: toggleDevView })));
    }
}
exports.default = react_redux_1.connect(mapStateToProps, null)(Header);
//# sourceMappingURL=Header.js.map