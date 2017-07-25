import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, ConnectionInfo } from '../../../type';
import * as Conn from '../../../connector';
import * as Action from '../../actions';
import Core from '../../../core';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
    onSuccess: () => void;
};

type State = {
    method: 'local' | 'remote';
    localURL: string;
    localMessage: string;
};

type DispatchProps = {
    handleAddConnection: (connInfo: ConnectionInfo) => void;
}
type Props = OwnProps & DispatchProps

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        handleAddConnection: (connInfo) => {
            dispatch(Action.CONNECTION.addConnection(connInfo));
        }
    };
}
class NewConnection extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            method: 'local',
            localURL: '',
            localMessage: ''
        };
        this.selectLocal = this.selectLocal.bind(this);
        this.selectRemote = this.selectRemote.bind(this);
        this.handleLocalURLChange = this.handleLocalURLChange.bind(this);
    }

    selectLocal() {
        this.setState({
            method: 'local'
        } as State);
    }

    selectRemote() {
        this.setState({
            method: 'remote'
        } as State);
    }

    handleLocalURLChange(event) {
        this.setState({
            localURL: event.target.value
        });
    }

    render() {
        const disableLocal = this.state.method !== 'local';
        const disableRemote = this.state.method !== 'remote';
        return (
            <section className={this.props.className}>
                <section>
                    <form id="new-connection-dashboard">
                        <input
                            id="local-connection" className='input-radio'
                            type='radio' name='connection-method'
                            defaultChecked
                            onChange={this.selectLocal}
                        />
                        <label htmlFor="local-connection">
                            <h3><span className="icon icon-home">Local</span></h3>
                            <p>Establish connection to the Agda executable on your machine. The good old default.
                            </p>
                            <input
                                className='input-text native-key-bindings'
                                type='text' placeholder='path to Agda'
                                disabled={disableLocal}
                                value={this.state.localURL}
                                onChange={this.handleLocalURLChange}
                            />
                            <button
                                className="btn icon btn-primary icon-plus inline-block-tight"
                                disabled={disableLocal}
                                onClick={() => {
                                    Conn.validate(this.state.localURL)
                                        .then((conn) => {
                                            this.props.handleAddConnection(conn)
                                            this.props.onSuccess();
                                            this.setState({
                                                localMessage: ''
                                            });
                                        })
                                        .catch((error) => {
                                            this.setState({
                                                localMessage: error.message
                                            });
                                        })
                                }}
                            >add</button>
                            <button
                                className="btn icon btn-warning icon-search inline-block-tight"
                                disabled={disableLocal}
                                onClick={() => {
                                    Conn.autoSearch()
                                        .then(uri => {
                                            this.setState({
                                                localURL: uri
                                            })
                                        })
                                        .catch(Conn.AutoSearchFailure, () => {
                                            this.setState({
                                                localMessage: 'failed to search for the location of Agda'
                                            });
                                        })
                                }}
                            >auto</button>
                            <div className='text-warning'>{this.state.localMessage}</div>
                        </label>
                        <hr/>
                        <input
                            id="remote-connection" className='input-radio'
                            type='radio' name='connection-method'
                            onChange={this.selectRemote}
                            disabled={true}
                        />
                        <label htmlFor="remote-connection">
                            <h3><span className="icon icon-globe">Remote</span></h3>
                            <p>Establish connection to some remote Agda process on this planet via TCP/IP</p>
                            <div id="remote-connection-inputs">
                                <input id="remote-connection-url" className='input-text native-key-bindings' type='text' placeholder='URL' disabled={disableRemote}/>
                                <input id="remote-connection-port" className='input-text native-key-bindings' type='text' placeholder='port' defaultValue="8192" disabled={disableRemote}/>
                            </div>
                            <button
                                className="btn icon btn-primary icon-zap inline-block-tight"
                                disabled={disableRemote}
                            >connect</button>
                        </label>
                    </form>
                </section>
            </section>
        )
    }
}

export default connect<{}, DispatchProps, OwnProps>(
    null,
    mapDispatchToProps
)(NewConnection);
