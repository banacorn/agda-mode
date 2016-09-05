"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require('react');
var SizingHandle = (function (_super) {
    __extends(SizingHandle, _super);
    function SizingHandle() {
        _super.apply(this, arguments);
    }
    SizingHandle.prototype.render = function () {
        var _this = this;
        var _a = this.props, onResizeStart = _a.onResizeStart, onResize = _a.onResize, onResizeEnd = _a.onResizeEnd;
        return (React.createElement("div", {id: "agda-sizing-handle-anchor"}, 
            React.createElement("div", {id: "agda-sizing-handle", onDragStart: function (e) {
                _this.setState({
                    initial: e.pageY
                });
                if (onResizeStart)
                    onResizeStart(e.pageY);
            }, onDrag: function (e) {
                if (e.pageY !== 0) {
                    var offset = e.pageY - _this.state.initial;
                    if (offset !== 0) {
                        if (onResize)
                            onResize(offset);
                        _this.setState({
                            initial: e.pageY
                        });
                    }
                }
            }, onDragEnd: function (e) {
                if (onResizeEnd)
                    onResizeEnd(e.pageY);
            }, draggable: "true", className: "native-key-bindings sizing-handle", tabIndex: "-1"})
        ));
    };
    return SizingHandle;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SizingHandle;
//# sourceMappingURL=SizingHandle.js.map