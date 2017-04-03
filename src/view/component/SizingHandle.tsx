import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../types';

interface Props {
    // initial: number;
    onResizeStart?: (pageY: number) => void;
    onResize?: (offset: number) => void;
    onResizeEnd?: (pageY: number) => void;
    atBottom: boolean;
}

interface State {
    initial: number
}

class SizingHandle extends React.Component<Props, State> {
    private ref: HTMLElement;
    calculateBodyHeight(handleY: number) {
        if (this.ref && this.props.atBottom) {
            const top = this.ref.getBoundingClientRect().top + 51; // border-width: 1px
            const bottom = document.querySelector('atom-panel-container.footer').getBoundingClientRect().top
            if (top > 0) {
                return bottom - handleY - 50.5;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    render() {
        const { onResizeStart, onResize, onResizeEnd, atBottom } = this.props;
        return (
            <div className="sizing-handle-anchor">
                <div
                    className="sizing-handle native-key-bindings"
                    ref={(ref) => {
                        this.ref = ref
                    }}
                    onDragStart={(e) => {
                        this.setState({
                            initial: e.clientY
                        })
                        if (onResizeStart && atBottom)
                            onResizeStart(this.calculateBodyHeight(e.clientY));
                    }}
                    onDrag={(e) => {
                        if (e.clientY !== 0 && atBottom) {    // filter wierd noise out
                            const offset = e.pageY - this.state.initial;
                            if (offset !== 0) {
                                if (onResize)
                                    onResize(this.calculateBodyHeight(e.clientY));
                                this.setState({
                                    initial: e.clientY
                                });
                            }
                        }
                    }}
                    onDragEnd={(e) => {
                        if (onResizeEnd && atBottom) {
                            onResizeEnd(this.calculateBodyHeight(e.clientY));
                        }
                    }}
                    // to enable Drag & Drop
                    draggable={true}
                    tabIndex={-1}
                ></div>
            </div>
        )
    }
}

export default SizingHandle;
