"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var InputMethod_1 = require('./InputMethod');
var Panel = (function (_super) {
    __extends(Panel, _super);
    function Panel() {
        _super.apply(this, arguments);
    }
    Panel.prototype.render = function () {
        var core = this.props.core;
        return (React.createElement("section", null, 
            React.createElement(InputMethod_1.default, {updateTranslation: function (c) { return core.inputMethod.replaceBuffer(c); }, insertCharacter: function (c) {
                core.inputMethod.insertCharToBufffer(c);
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
            }, chooseSymbol: function (c) {
                core.inputMethod.replaceBuffer(c);
                core.inputMethod.deactivate();
                atom.views.getView(atom.workspace.getActiveTextEditor()).focus();
            }})
        ));
    };
    return Panel;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Panel;
//# sourceMappingURL=Panel.js.map