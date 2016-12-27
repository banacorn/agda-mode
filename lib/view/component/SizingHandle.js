"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var React = require("react");
var SizingHandle = (function (_super) {
    __extends(SizingHandle, _super);
    function SizingHandle() {
        return _super.apply(this, arguments) || this;
    }
    SizingHandle.prototype.calculateBodyHeight = function (handleY) {
        if (this.ref && this.props.atBottom) {
            var top_1 = this.ref.getBoundingClientRect().top + 51; // border-width: 1px
            var bottom = document.querySelector('atom-panel-container.footer').getBoundingClientRect().top;
            if (top_1 > 0) {
                return bottom - handleY - 50.5;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    };
    SizingHandle.prototype.render = function () {
        var _this = this;
        var _a = this.props, onResizeStart = _a.onResizeStart, onResize = _a.onResize, onResizeEnd = _a.onResizeEnd, atBottom = _a.atBottom;
        return (React.createElement("div", { className: "agda-sizing-handle-anchor" },
            React.createElement("div", { className: "agda-sizing-handle native-key-bindings", ref: function (ref) {
                    _this.ref = ref;
                }, onDragStart: function (e) {
                    _this.setState({
                        initial: e.clientY
                    });
                    if (onResizeStart && atBottom)
                        onResizeStart(_this.calculateBodyHeight(e.clientY));
                }, onDrag: function (e) {
                    if (e.clientY !== 0 && atBottom) {
                        var offset = e.pageY - _this.state.initial;
                        if (offset !== 0) {
                            if (onResize)
                                onResize(_this.calculateBodyHeight(e.clientY));
                            _this.setState({
                                initial: e.clientY
                            });
                        }
                    }
                }, onDragEnd: function (e) {
                    if (onResizeEnd && atBottom) {
                        onResizeEnd(_this.calculateBodyHeight(e.clientY));
                    }
                }, 
                // to enable Drag & Drop
                draggable: true, tabIndex: -1 })));
    };
    return SizingHandle;
}(React.Component));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SizingHandle;
//# sourceMappingURL=SizingHandle.js.map