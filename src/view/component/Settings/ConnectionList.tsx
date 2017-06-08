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
                <p>
                    <span className='inline-block highlight-info'>appointed default</span>
                    <span className='inline-block highlight-success'>connected</span>
                </p>
                <ol>
                    {
                        this.props.state.connectionInfos.map((connInfo) => {
                            return <ConnectionItem
                                key={connInfo.guid}
                                uri={connInfo.uri}
                                version={connInfo.version.sem}
                                selected={this.props.state.selected === connInfo.guid}
                                connected={this.props.state.connected === connInfo.guid}
                                onSelect={() => {
                                    this.props.handleSelect(connInfo.guid);
                                    this.props.onSelect(connInfo);
                                }}
                                onSelectAndLoad={() => {
                                    this.props.handleSelect(connInfo.guid);
                                    this.props.handleLoad(connInfo.guid);
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
)(ConnectionList);
