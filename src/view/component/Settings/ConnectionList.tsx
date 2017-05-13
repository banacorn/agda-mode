import * as React from 'react';
import { connect } from 'react-redux';
// import * as _ from 'lodash';
// import * as classNames from 'classnames';
import { View, Connection, GUID } from '../../../type';
import * as Conn from '../../../connector';
import ConnectionItem from './ConnectionItem';
import * as Action from '../../actions';

type OwnProps = React.HTMLProps<HTMLElement> & {
    onNew: () => void;
    onConnect: (conn: Connection) => void;
};

type InjProps = {
    state: View.ConnectionState
};
type DispatchProps = {
    handleRemoveConnection: (guid: GUID) => void
    handlePinConnection: (guid: GUID) => void
    handleConnect: (conn: Connection) => void
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
                        this.props.state.connections.map((conn) => {
                            return <ConnectionItem
                                key={conn.guid}
                                uri={conn.uri}
                                version={conn.version.sem}
                                pinned={this.props.state.pinned === conn.guid}
                                current={this.props.state.current === conn.guid}
                                onConnect={() => {
                                    if (this.props.state.current !== conn.guid) {
                                        this.props.handleConnect(conn);
                                        this.props.onConnect(conn);
                                    }
                                }}
                                onRemove={(e) => {
                                    this.props.handleRemoveConnection(conn.guid)
                                    e.stopPropagation()
                                }}
                                onPin={(e) => {
                                    this.props.handlePinConnection(conn.guid)
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
