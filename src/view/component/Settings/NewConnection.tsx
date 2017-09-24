import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, ConnectionInfo } from '../../../type';
import * as Conn from '../../../connector';
import { ConnectionError } from '../../../error';
import * as Action from '../../actions';
import Core from '../../../core';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
    onSuccess: () => void;
};

type State = {
    agdaLocation: string;
    agdaMessage: string;
    lspEnable: boolean;
    lspLocation: string;
    lspMessage: string;
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
            agdaLocation: '',
            agdaMessage: '',
            lspEnable: false,
            lspLocation: '',
            lspMessage: ''
        };
        this.handleAgdaLocationChange = this.handleAgdaLocationChange.bind(this);
        this.handleLanguageServerLocationChange = this.handleLanguageServerLocationChange.bind(this);
        this.addAgda = this.addAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
    }

    handleAgdaLocationChange(event) {
        this.setState({
            agdaLocation: event.target.value
        });
    }

    handleLanguageServerLocationChange(event) {
        this.setState({
            lspLocation: event.target.value
        });
    }

    addAgda() {
        if (this.state.lspEnable) {
            Conn.validateAgda(this.state.agdaLocation)
                .then(Conn.mkConnectionInfo)
                .then(connInfo => {
                    return Conn.validateLanguageServer(this.state.lspLocation)
                        .then(lspProcInfo => {
                            connInfo.languageServer = lspProcInfo;
                            this.props.handleAddConnection(connInfo)
                            this.props.onSuccess();
                            this.setState({
                                agdaMessage: ''
                            });
                        })
                        .catch((error) => {
                            this.setState({
                                lspMessage: error.message
                            });
                        })
                })
                .catch((error) => {
                    this.setState({
                        agdaMessage: error.message
                    });
                })
            // Conn.validate(this.state.agdaLocation)
        } else {
            Conn.validateAgda(this.state.agdaLocation)
                .then(Conn.mkConnectionInfo)
                .then(connInfo => {
                    this.props.handleAddConnection(connInfo)
                    this.props.onSuccess();
                    this.setState({
                        agdaMessage: ''
                    });
                })
                .catch((error) => {
                    this.setState({
                        agdaMessage: error.message
                    });
                })
        }
    }

    searchAgda() {
        Conn.autoSearch('agda')
            .then(location => {
                this.setState({
                    agdaLocation: location
                })
            })
            .catch(ConnectionError, error => {
                if (error.kind === 'AutoSearchFailure') {
                    this.setState({
                        agdaMessage: 'Failed searching for the location of Agda'
                    });
                } else {
                    this.setState({
                        agdaMessage: error.message
                    });
                }
            })
        // prevent this button from submitting the entire form
        return false;
    }

    searchLanguageServer() {
        Conn.autoSearch('agda-language-server')
            .then(location => {
                this.setState({
                    lspLocation: location
                })
            })
            .catch(ConnectionError, error => {
                if (error.kind === 'AutoSearchFailure') {
                    this.setState({
                        agdaMessage: 'Failed searching for the location of Agda Language Server'
                    });
                } else {
                    this.setState({
                        agdaMessage: error.message
                    });
                }
            })
        // prevent this button from submitting the entire form
        return false;
    }

    toggleLSPChange() {
        this.setState({
            lspEnable: !this.state.lspEnable
        });
    }

    render() {
        return (
            <section className={this.props.className}>
                <h2><span className="icon icon-plus">Establish new connection</span></h2>
                <form>
                    <input
                        className='input-text native-key-bindings'
                        type='text' placeholder='location of Agda'
                        value={this.state.agdaLocation}
                        onChange={this.handleAgdaLocationChange}
                    />
                    <p>
                        <button
                            className="btn icon btn-primary icon-plus inline-block-tight"
                            onClick={this.addAgda}
                        >add</button>
                        <button
                            className="btn icon btn-success icon-search inline-block-tight"
                            onClick={this.searchAgda}
                        >auto</button>
                    </p>
                </form>
                {this.state.agdaMessage &&
                    <div className="inset-panel padded text-warning">Agda: {this.state.agdaMessage}</div>
                }
                <hr/>
                <h3><span className="icon icon-beaker">Experimental</span></h3>
                <p>
                    <label className='input-label'>
                        <input className='input-toggle' type='checkbox' onChange={this.toggleLSPChange} /> Agda Language Server
                    </label>
                </p>
                { this.state.lspEnable &&
                    <form>
                        <input
                            className='input-text native-key-bindings'
                            type='text' placeholder='location of Agda Language Server'
                            value={this.state.lspLocation}
                            onChange={this.handleLanguageServerLocationChange}
                        />
                        <p>
                            <button
                                className="btn icon btn-success icon-search inline-block-tight"
                                onClick={this.searchLanguageServer}
                            >auto</button>
                        </p>
                    </form>
                }
                {this.state.lspMessage &&
                    <div className="inset-panel padded text-warning">Language Server: {this.state.lspMessage}</div>
                }
            </section>
        );
    }
}

export default connect<{}, DispatchProps, OwnProps>(
    null,
    mapDispatchToProps
)(NewConnection);
