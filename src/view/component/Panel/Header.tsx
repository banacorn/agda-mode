import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';

import { View } from '../../../type';
import * as Action from '../../actions';

// import Dashboard from './Dashboard';
import { Core } from '../../../core';
var Dashboard = require('../../../Reason/View/Panel/Dashboard.bs').jsComponent;

function toStyle(type: View.Style): string {
    switch (type) {
        case View.Style.Error:     return 'error';
        case View.Style.Warning:   return 'warning';
        case View.Style.Info:      return 'info';
        case View.Style.Success:   return 'success';
        case View.Style.PlainText: return 'plain-text';
        default:                  return '';
    }
}

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = View.HeaderState & {
    inputMethodActivated: boolean;

    mountAt: {
        previous: View.MountingPosition,
        current: View.MountingPosition
    };
    settingsView: boolean;
    pending: boolean;
};

type DispatchProps = {
    handleMountAtPane: () => void
    handleMountAtBottom: () => void;
    handleToggleSettingsView: () => void;
}

type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        text: state.header.text,
        style: state.header.style,
        inputMethodActivated: state.inputMethod.activated,

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

class Header extends React.Component<Props, {}> {
    render() {
        const { text, style, core, inputMethodActivated, pending, mountAt, settingsView } = this.props;
        const classes = classNames({
            hidden: inputMethodActivated || _.isEmpty(text)
        }, 'agda-header')
        return (
            <div className={classes}>
                <h1 className={`text-${toStyle(style)}`}>{text}</h1>
                <Dashboard
                    isPending={pending}
                    mountAt={mountAt.current === View.MountingPosition.Bottom ? 'bottom' : 'pane'}
                    onMountChange={(at) => {
                        core.view.toggleDocking();
                        if (at === "bottom") {
                            this.props.handleMountAtBottom();
                        } else {
                            this.props.handleMountAtPane();
                        }
                    }}
                    settingsViewOn={settingsView}
                    onSettingsViewToggle={(isActivated) => {
                        this.props.handleToggleSettingsView();
                        if (isActivated) {
                            core.view.tabs.open('settings');
                        } else {
                            core.view.tabs.close('settings');
                        }
                    }}
                />
            </div>
        )
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Header);
