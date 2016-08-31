"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var Error = (function (_super) {
    __extends(Error, _super);
    function Error() {
        _super.apply(this, arguments);
    }
    Error.prototype.render = function () {
        var error = this.props.error;
        switch (error.kind) {
            case 'Unparsed': return (React.createElement("li", {className: "list-item"}, 
                React.createElement("span", null, error.input)
            ));
        }
    };
    return Error;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Error;
//# sourceMappingURL=Error.js.map