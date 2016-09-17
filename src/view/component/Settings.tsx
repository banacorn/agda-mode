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
    mountingPosition: View.MountingPosition;
    devView: boolean;
    // callbacks
    mountAtPane: () => void;
    mountAtBottom: () => void;
    toggleDevView: () => void;
    // dispatch to the store
    handleMountAtPane: () => void
    handleMountAtBottom: () => void;
    handleToggleDevView: () => void;
}

const mapStateToProps = (state: View.State) => ({
    mountingPosition: state.view.mountAt.current,
    devView: state.view.devView
});

const mapDispatchToProps = (dispatch: any) => ({
    handleMountAtPane: () => {
        dispatch(Action.mountAtPane());
    },
    handleMountAtBottom: () => {
        dispatch(Action.mountAtBottom());
    },
    handleToggleDevView: () => {
        dispatch(Action.toggleDevView());
    }
});

class Settings extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private toggleMountingPositionButton: HTMLElement;


    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: 300,
            keyBindingCommand: 'agda-mode:toggle-docking'

        }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        const { mountingPosition, devView } = this.props;
        const { mountAtPane, mountAtBottom, toggleDevView } = this.props;
        const { handleMountAtPane, handleMountAtBottom, handleToggleDevView } = this.props;
        // show dev view button only when in dev mode
        const devViewClassList = classNames({
            activated: devView,
            hidden: !atom.inDevMode()
        }, 'no-btn');
        const toggleMountingPosition = classNames({
            activated: mountingPosition === View.MountingPosition.Pane
        }, 'no-btn');
        return (
            <ul className="agda-settings">
                <li>
                    <button
                        className={devViewClassList}
                        onClick={() => {
                            toggleDevView()
                            handleToggleDevView()
                        }}
                    >
                        <span className="icon icon-tools"></span>
                    </button>
                </li>
                <li>
                    <button
                        className={toggleMountingPosition}
                        onClick={() => {
                            switch (mountingPosition) {
                                case View.MountingPosition.Bottom:
                                    handleMountAtPane();
                                    mountAtPane();
                                    break;
                                case View.MountingPosition.Pane:
                                    handleMountAtBottom();
                                    mountAtBottom();
                                    break;
                                default:
                                    console.error('no mounting position to transist from')
                            }
                        }}
                        ref={(ref) => {
                            this.toggleMountingPositionButton = ref;
                        }}
                    >
                        <span className="icon icon-versions"></span>
                    </button>
                </li>
            </ul>
        )
    }
}

export default connect<any, any, any>(
    mapStateToProps,
    mapDispatchToProps
)(Settings);
