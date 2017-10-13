import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../type';
import Core from '../../core';
import { View } from '../../type';
import * as Action from '../actions';

import Breadcrumb from './Settings/Breadcrumb';
import Connections from './Settings/Connections';
import NewConnection from './Settings/NewConnection';
import Protocol from './Settings/Protocol';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
}
type InjProps = {
    path: View.SettingsPath
}

type DispatchProps = {
    navigate: (path: View.SettingsPath) => () => void
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        path: state.settings
    }
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        navigate: (path: View.SettingsPath) => () => {
            dispatch(Action.SETTINGS.navigate(path));
        }
    };
}

class Settings extends React.Component<Props, {}> {

    constructor(props) {
        super(props);
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }

    render() {
        const { core } = this.props;
        return (
            <section
                className="agda-settings native-key-bindings"
                tabIndex={-1}
            >
                <Breadcrumb
                    navigate={this.props.navigate}
                    path={this.props.path}
                />
                <ul
                    className={classNames("agda-settings-menu", this.at('/'))}
                >
                    <li
                        onClick={this.props.navigate('/Connections')}
                    >
                        <span className="icon icon-plug">Connections</span>
                    </li>
                    <li
                        onClick={this.props.navigate('/Protocol')}
                    >
                        <span className="icon icon-comment-discussion">Protocol</span>
                    </li>
                </ul>
                <div className="agda-settings-pages">
                    <Connections
                        className={this.at('/Connections')}
                        onNew={this.props.navigate('/Connections/New')}
                        onSelect={(connInfo) => {
                            core.connector.select(connInfo);
                        }}
                        onSelectAndLoad={(connInfo) => {
                            core.connector.select(connInfo);
                            core.view.store.dispatch(Action.PROTOCOL.clearAll());
                            core.commander.dispatch({ kind: 'Load' });
                        }}
                        onRemove={(connInfo) => {
                            core.connector.unselect(connInfo);
                        }}
                    />
                    <NewConnection
                        core={this.props.core}
                        className={this.at('/Connections/New')}
                        onSuccess={this.props.navigate('/Connections')}
                    />
                    <Protocol
                        // core={this.props.core}
                        className={this.at('/Protocol')}
                    />
                </div>
            </section>
        )
    }

    at(path: View.SettingsPath): string {
        return classNames({
            'hidden': path !== this.props.path
        })
    }

    notAt(path: View.SettingsPath): string {
        return classNames({
            'hidden': path === this.props.path
        })
    }


}


// <Connections
//     core={this.props.core}
//     className={this.at('/Connections')}
// />

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Settings);
