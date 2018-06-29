import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';

import { View } from '../../../type';
import * as Action from '../../actions';
import { Core } from '../../../core';

// Atom shits
import { CompositeDisposable } from 'atom';
import * as Atom from 'atom';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = {
    mountAt: {
        previous: View.MountingPosition,
        current: View.MountingPosition
    };
    settingsView: boolean;
    pending: boolean;
}
type DispatchProps = {
    handleMountAtPane: () => void
    handleMountAtBottom: () => void;
    handleToggleSettingsView: () => void;
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        mountAt: state.view.mountAt,
        settingsView: state.view.settingsView,
        pending: state.protocol.pending
    }
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        handleMountAtPane: () => {
            dispatch(Action.VIEW.mountAtPane());
        },
        handleMountAtBottom: () => {
            dispatch(Action.VIEW.mountAtBottom());
        },
        handleToggleSettingsView: () => {
            dispatch(Action.VIEW.toggleSettings());
        }
    };
}

class Dashboard extends React.Component<Props, {}> {
    private subscriptions: Atom.CompositeDisposable;
    private toggleMountingPositionButton: HTMLElement;
    private toggleSettingsViewButton: HTMLElement;

    constructor(props: Props) {
        super(props);
        this.subscriptions = new CompositeDisposable;
    }

    componentDidMount() {
        this.subscriptions.add(atom.tooltips.add(this.toggleSettingsViewButton, {
            title: 'settings',
            delay: {
                show: 100,
                hide: 1000
            }
        }));
        this.subscriptions.add(atom.tooltips.add(this.toggleMountingPositionButton, {
            title: 'toggle panel docking position',
            delay: {
                show: 300,
                hide: 1000
            },
            keyBindingCommand: 'agda-mode:toggle-docking'

        }));
    }

    componentWillUnmount() {
        this.subscriptions.dispose();
    }

    render() {
        const { mountAt, settingsView, pending } = this.props;
        const { core } = this.props;
        const { handleToggleSettingsView } = this.props;
        const spinnerClassList = classNames({
            pending
        }, 'loading loading-spinner-tiny inline-block');
        const settingsViewClassList = classNames({
            activated: settingsView,
        }, 'no-btn');
        const toggleMountingPosition = classNames({
            activated: mountAt.current === View.MountingPosition.Pane
        }, 'no-btn');
        return (
            <ul className="agda-dashboard">
                <li>
                    <span id="spinner" className={spinnerClassList}></span>
                </li>
                <li>
                    <button
                        className={settingsViewClassList}
                        onClick={() => {
                            handleToggleSettingsView()
                            if (settingsView) {
                                core.view.tabs.close('settings');
                            } else {
                                core.view.tabs.open('settings');
                            }
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
                            core.view.toggleDocking();
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

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Dashboard);
