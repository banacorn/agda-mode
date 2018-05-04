import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../type';
import { Core } from '../../core';
import { View } from '../../type';
import * as Action from '../actions';

import Breadcrumb from './Settings/Breadcrumb';
import Connection from './Settings/Connection';
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
        this.props.core.connection.disconnect = this.props.core.connection.disconnect.bind(this);
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
                        onClick={this.props.navigate('/Connection')}
                    >
                        <span className="icon icon-plug">Connection</span>
                    </li>
                    <li
                        onClick={this.props.navigate('/Protocol')}
                    >
                        <span className="icon icon-comment-discussion">Protocol</span>
                    </li>
                </ul>
                <div className="agda-settings-pages">
                    <Connection
                        className={this.at('/Connection')}
                        onConnect={(validated) => {
                            this.props.core.connection.connect(validated);
                        }}
                        onDisconnect={() => {
                            this.props.core.commander.dispatch({
                                kind: 'Quit'
                            }).then(this.props.core.connection.disconnect);
                        }}
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
