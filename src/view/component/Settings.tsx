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
    settingsView: boolean;
    // callbacks
    mountAtPane: () => void;
    mountAtBottom: () => void;
    toggleSettingsView: () => void;
    // dispatch to the store
    handleMountAtPane: () => void
    handleMountAtBottom: () => void;
    handleToggleSettingsView: () => void;
}

const mapStateToProps = (state: View.State) => ({
    mountingPosition: state.view.mountAt.current,
    settingsView: state.view.settingsView
});

const mapDispatchToProps = (dispatch: any) => ({
    handleMountAtPane: () => {
        dispatch(Action.mountAtPane());
    },
    handleMountAtBottom: () => {
        dispatch(Action.mountAtBottom());
    },
    handleToggleSettingsView: () => {
        dispatch(Action.toggleSettingsView());
    }
});

class Settings extends React.Component<Props, void> {
    private subscriptions: CompositeDisposable;
    private toggleMountingPositionButton: HTMLElement;
    private toggleSettingsViewButton: HTMLElement;


    constructor() {
        super();
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleSettingsViewButton, {
            title: 'settings',
            delay: 100
        }));
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
        const { mountingPosition, settingsView } = this.props;
        const { mountAtPane, mountAtBottom, toggleSettingsView } = this.props;
        const { handleMountAtPane, handleMountAtBottom, handleToggleSettingsView } = this.props;
        const settingsViewClassList = classNames({
            activated: settingsView,
        }, 'no-btn');
        const toggleMountingPosition = classNames({
            activated: mountingPosition === View.MountingPosition.Pane
        }, 'no-btn');
        return (
            <ul className="agda-settings">
                <li>
                    <button
                        className={settingsViewClassList}
                        onClick={() => {
                            handleToggleSettingsView()
                            toggleSettingsView()
                        }}
                        ref={(ref) => {
                            this.toggleSettingsViewButton = ref;
                        }}
                    >
                        <span className="icon icon-settings"></span>
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
