"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var react_redux_1 = require('react-redux');
// interface Props extends View.HeaderState {
//     // inputMethodActivated: boolean;
//     // mountAtPane: () => void;
//     // mountAtBottom: () => void;
//     // toggleDevView: () => void;
// }
// const mapStateToProps = (state: View.State) => {
//     return {
//         text: state.header.text,
//         style: state.header.style,
//         inputMethodActivated: state.inputMethod.activated
//     }
// }
var Dev = (function (_super) {
    __extends(Dev, _super);
    function Dev() {
        _super.apply(this, arguments);
    }
    Dev.prototype.render = function () {
        // const { text, style, inputMethodActivated } = this.props;
        // const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        // const classes = classNames({
        //     hidden: inputMethodActivated || _.isEmpty(text)
        // }, 'agda-header')
        return (React.createElement("div", null, "dev"));
    };
    return Dev;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = react_redux_1.connect(null, 
// mapStateToProps,
null)(Dev);
//# sourceMappingURL=Dev.js.map