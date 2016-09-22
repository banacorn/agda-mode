import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../types';
import * as Action from '../actions';

// Atom shits
type CompositeDisposable = any;
var { CompositeDisposable } = require('atom');
declare var atom: any;

interface Props {
    // mountingPosition: View.MountingPosition;
    // devView: boolean;
    // // callbacks
    // mountAtPane: () => void;
    // mountAtBottom: () => void;
    // toggleDevView: () => void;
    // dispatch to the store
    // clearAll: () => void
}

const mapStateToProps = (state: View.State) => ({
    // devView: state.view.devView
});

const mapDispatchToProps = (dispatch: any) => ({
    // clearAll: () => {
    //     dispatch(Action.mountAtPane());
    // },
    // handleMountAtBottom: () => {
    //     dispatch(Action.mountAtBottom());
    // },
    // handleToggleDevView: () => {
    //     dispatch(Action.toggleDevView());
    // }
});

class DevPanel extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private clearAllButton: HTMLElement;

    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.clearAllButton, {
            title: 'clear all messages',
            delay: 100

        }));
        // this.subscriptions.add(atom.tooltips.add(this.toggleDevViewButton, {
        //     title: 'toggle dev view (only available in dev mode)',
        //     delay: 100
        // }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        // const { mountingPosition, devView } = this.props;
        // const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        // const { handleMountAtPane, handleMountAtBottom, handleToggleDevView } = this.props;
        // show dev view button only when in dev mode
        // const devViewClassList = classNames({
        //     activated: devView,
        //     hidden: !atom.inDevMode()
        // }, 'no-btn');
        // const toggleMountingPosition = classNames({
        //     activated: mountingPosition === View.MountingPosition.Pane
        // }, 'no-btn');
        return (
            <ul className="agda-dev-panel">
                <li>
                    <button
                        className="no-btn"
                        onClick={() => {
                        }}
                        ref={(ref) => {
                            this.clearAllButton = ref;
                        }}
                    >
                        <span className="icon icon-trashcan"></span>
                    </button>
                </li>
            </ul>
        )
    }
}

export default connect<any, any, any>(
    null,
    null
    // mapStateToProps,
    // mapDispatchToProps
)(DevPanel);
