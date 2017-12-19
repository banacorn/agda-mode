"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const React = require("react");
class SizingHandle extends React.Component {
    calculateBodyHeight(handleY) {
        if (this.ref && this.props.atBottom) {
            const top = this.ref.getBoundingClientRect().top + 51; // border-width: 1px
            const bottom = document.querySelector('atom-panel-container.footer').getBoundingClientRect().top;
            if (top > 0) {
                return bottom - handleY - 50.5;
            }
            else {
                return null;
            }
        }
        else {
            return null;
        }
    }
    render() {
        const { onResizeStart, onResize, onResizeEnd, atBottom } = this.props;
        return (React.createElement("div", { className: "sizing-handle-anchor" },
            React.createElement("div", { className: "sizing-handle native-key-bindings", ref: (ref) => {
                    this.ref = ref;
                }, onDragStart: (e) => {
                    this.setState({
                        initial: e.clientY
                    });
                    if (onResizeStart && atBottom)
                        onResizeStart(this.calculateBodyHeight(e.clientY));
                }, onDrag: (e) => {
                    if (e.clientY !== 0 && atBottom) {
                        const offset = e.pageY - this.state.initial;
                        if (offset !== 0) {
                            if (onResize)
                                onResize(this.calculateBodyHeight(e.clientY));
                            this.setState({
                                initial: e.clientY
                            });
                        }
                    }
                }, onDragEnd: (e) => {
                    if (onResizeEnd && atBottom) {
                        onResizeEnd(this.calculateBodyHeight(e.clientY));
                    }
                }, 
                // to enable Drag & Drop
                draggable: true, tabIndex: -1 })));
    }
}
exports.default = SizingHandle;
//# sourceMappingURL=SizingHandle.js.map