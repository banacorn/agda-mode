import * as React from 'react';
import { connect } from 'react-redux';
// import * as _ from 'lodash';
// import * as classNames from 'classnames';
import { View, ConnectionInfo, GUID } from '../../../type';
import * as Conn from '../../../connector';
import ConnectionItem from './ConnectionItem';
import * as Action from '../../actions';

type OwnProps = React.HTMLProps<HTMLElement> & {
    onNew: () => void;
    onConnect: (connInfo: ConnectionInfo) => void;
};

type InjProps = {
    state: View.ConnectionState
};
type DispatchProps = {
    handleRemoveConnection: (guid: GUID) => void
    handlePinConnection: (guid: GUID) => void
    handleConnect: (connInfo: ConnectionInfo) => void
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        state: state.connection
    };
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        handleRemoveConnection: (guid) => {
            dispatch(Action.CONNECTION.removeConnection(guid));
        },
        handlePinConnection: (guid) => {
            dispatch(Action.CONNECTION.pinConnection(guid));
        },
        handleConnect: (conn) => {
            dispatch(Action.CONNECTION.connect(conn));
        }
    };
}

class ConnectionList extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <section className={this.props.className}>
                <header>
                    <h2><span className="icon icon-plug">Connections</span></h2>
                    <div>
                        <button
                            className="btn icon btn-primary icon-plus inline-block-tight"
                            onClick={this.props.onNew}
                        >new</button>
                    </div>
                </header>
                <ol>
                    {
                        this.props.state.connectionInfos.map((connInfo) => {
                            return <ConnectionItem
                                key={connInfo.guid}
                                uri={connInfo.uri}
                                version={connInfo.version.sem}
                                pinned={this.props.state.pinned === connInfo.guid}
                                current={this.props.state.current === connInfo.guid}
                                onConnect={() => {
                                    if (this.props.state.current !== connInfo.guid) {
                                        this.props.handleConnect(connInfo);
                                        this.props.onConnect(connInfo);
                                    }
                                }}
                                onRemove={(e) => {
                                    this.props.handleRemoveConnection(connInfo.guid)
                                    e.stopPropagation()
                                }}
                                onPin={(e) => {
                                    this.props.handlePinConnection(connInfo.guid)
                                    e.stopPropagation()
                                }}
                            />
                        })
                }
                </ol>
            </section>
        )
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(ConnectionList);
