import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
// import * as classNames from 'classnames';
import { View, ConnectionInfo, GUID } from '../../../type';
import * as Conn from '../../../connector';
import ConnectionItem from './ConnectionItem';
import * as Action from '../../actions';

type OwnProps = React.HTMLProps<HTMLElement> & {
    onNew: () => void;
    onRemove: (connInfo: ConnectionInfo) => void;
    onSelect: (connInfo: ConnectionInfo) => void;
    onSelectAndLoad: (connInfo: ConnectionInfo) => void;
};

type InjProps = {
    state: View.ConnectionState
};
type DispatchProps = {
    handleRemove: (guid: GUID) => void
    handleSelect: (guid: GUID) => void
    handleLoad: (guid: GUID) => void
}
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        state: state.connection
    };
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        handleRemove: (guid) => {
            dispatch(Action.CONNECTION.removeConnection(guid));
        },
        handleSelect: (guid) => {
            dispatch(Action.CONNECTION.selectConnection(guid));
        },
        handleLoad: (guid) => {
            dispatch(Action.CONNECTION.connect(guid));
        }
    };
}

class Connections extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        const noConnections = this.props.state.connectionInfos.length === 0;
        return (
            <section className={this.props.className}>
                <h2>Connections</h2>
                <p>
                    A list of previously (or to be) established connections to Agda.
                    <br/>
                    The <span className='text-info'>appointed</span> connection will be established on reload or when double-clicked.
                </p>
                {noConnections
                    ? <p className='background-message'>
                        No Connections
                        <br />
                        <button
                            className="btn icon btn-primary icon-plus inline-block-tight"
                            onClick={this.props.onNew}
                        >Establish a new one</button>
                      </p>
                    : <p>
                            <button
                                className="btn icon icon-plus inline-block-tight"
                                onClick={this.props.onNew}
                            >Establish new connection</button>
                      </p>
                }
                <ol>
                    {this.props.state.connectionInfos.map((connInfo) => {
                            return <ConnectionItem
                                key={connInfo.guid}
                                location={connInfo.agda.location}
                                protocol={connInfo.languageServer ? 'LSP' : 'Vanilla'}
                                version={connInfo.agda.version.raw}
                                selected={this.props.state.selected === connInfo.guid}
                                connected={this.props.state.connected === connInfo.guid}
                                erred={_.includes(this.props.state.erred, connInfo.guid)}
                                onSelect={() => {
                                    this.props.handleSelect(connInfo.guid);
                                    this.props.onSelect(connInfo);
                                }}
                                onSelectAndLoad={() => {
                                    this.props.handleSelect(connInfo.guid);
                                    this.props.onSelectAndLoad(connInfo);
                                }}
                                onRemove={(e) => {
                                    this.props.handleRemove(connInfo.guid)
                                    this.props.onRemove(connInfo);
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
)(Connections);


// <p>
//     <span className='inline-block highlight-info'>appointed default</span>
//     <span className='inline-block highlight-success'>connected</span>
// </p>
