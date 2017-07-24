import * as React from 'react';
import { connect } from 'react-redux';
// import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Connection } from '../../../type';
import NewConnection from './NewConnection';
import ConnectionList from './ConnectionList';
import * as Conn from '../../../connector';
import Core from '../../../core';
import * as Action from '../../actions';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
};
type InjProps = View.ConnectionState;
type DispatchProps = {
    navigate: (path: View.SettingsPath) => () => void
}
type Props = OwnProps & InjProps & DispatchProps;

type State = {
    showNewConnectionView: boolean;
    method: 'local' | 'remote';
};

const mapStateToProps = ({ connection }): InjProps => connection

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        navigate: (path: View.SettingsPath) => () => {
            dispatch(Action.SETTINGS.navigate(path));
        }
    };
}
class Connections extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            showNewConnectionView: props.showNewConnectionView,
            method: 'local'
        };
    }

    toggleNewConnectionView(show: boolean) {
        return () => {
            this.setState({
                showNewConnectionView: show
            } as State);
        }
    }

    render() {
        const { core } = this.props;
        const { showNewConnectionView } = this.state;

        return (
            <div className={this.props.className}>
                <ConnectionList
                    className={classNames({
                        hidden: showNewConnectionView
                    })}
                    onNew={this.props.navigate('/Connections/New')}
                    onSelect={(connInfo) => {
                        core.connector.select(connInfo);
                    }}
                    onSelectAndLoad={(connInfo) => {
                        core.connector.select(connInfo);
                        core.commander.activate({
                            kind: 'Load',
                        });
                    }}
                    onRemove={(connInfo) => {
                        core.connector.unselect(connInfo);
                    }}
                />
            </div>
        )
    }
}

// export default connect<View.ConnectionState, {}, Props>(
export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Connections);

// <NewConnection

//     core={this.props.core}
//     className={classNames({
//         hidden: !showNewConnectionView
//     })}
//     onCancel={this.toggleNewConnectionView(false)}
// />
