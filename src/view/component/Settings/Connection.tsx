import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, ValidPath } from '../../../type';
import * as Conn from '../../../connection';
import * as Err from '../../../error';
import * as Action from '../../actions';
import { Core } from '../../../core';


type OwnProps = React.HTMLProps<HTMLElement> & {
    onConnect: (path: ValidPath) => void;
    onDisconnect: () => void;
};

type State = {
    agdaPath: string;
    agdaMessage: string;
    lspEnable: boolean;
    languageServerPath: string;
    languageServerMessage: string;
};

type InjProps = {
    connection: View.ConnectionState;
}
type DispatchProps = {
    // handleAddConnection: (connInfo: ConnectionInfo) => void;
}


type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        connection: state.connection
    }
}

class Connection extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            agdaPath: atom.config.get('agda-mode.agdaPath'),
            agdaMessage: '',
            lspEnable: false,
            languageServerPath: atom.config.get('agda-mode.languageServerPath'),
            languageServerMessage: ''
        };
        this.handleAgdaLocationChange = this.handleAgdaLocationChange.bind(this);
        this.handleLanguageServerLocationChange = this.handleLanguageServerLocationChange.bind(this);
        this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
    }

    handleAgdaLocationChange(event) {
        this.setState({
            agdaPath: event.target.value
        });
    }

    handleLanguageServerLocationChange(event) {
        this.setState({
            languageServerPath: event.target.value
        });
    }

    connectAgda() {
        Conn.validateAgda(this.state.agdaPath)
            .then(validated => {
                this.setState({
                    agdaMessage: ''
                });
                this.props.onConnect(validated);
            })
            .catch((error) => {
                this.setState({
                    agdaMessage: error.message
                });
            })
    }

    searchAgda() {
        Conn.autoSearch('agda')
            .then(location => {
                this.setState({
                    agdaPath: location
                })
            })
            .catch(Err.Conn.AutoSearchError, error => {
                this.setState({
                    agdaMessage: 'Failed searching for the location of Agda'
                });
            })
            .catch(error => {
                this.setState({
                    agdaMessage: error.message
                });
            })
        // prevent this button from submitting the entire form
        return false;
    }

    searchLanguageServer() {
        Conn.autoSearch('agda-language-server')
            .then(location => {
                this.setState({
                    languageServerPath: location
                })
            })
            .catch(Err.Conn.AutoSearchError, error => {
                this.setState({
                    languageServerPath: 'Failed searching for the location of Agda Language Server'
                });
            })
            .catch(error => {
                this.setState({
                    languageServerPath: error.message
                });
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
        const agda = this.props.connection.agda;
        const agdaOK = agda && this.state.agdaMessage === '';
        const agdaConnectionStatus = agdaOK ?
            <span className='inline-block highlight-success'>connected</span> :
            <span className='inline-block highlight-warning'>not connected</span>;
        const agdaVersion = agdaOK && <span className='inline-block highlight'>{agda.version.raw}</span>;

        const agdaButtonConnect =
            <button
                className='btn btn-primary icon icon-zap inline-block-tight'
                onClick={this.connectAgda}
                disabled={this.state.lspEnable}
            >agda-mode:load</button>;
        const agdaButtonDisconnect =
            <button
                className='btn btn-error icon icon-remove-close inline-block-tight'
                onClick={this.props.onDisconnect}
                disabled={this.state.lspEnable}
            >agda-mode:quit</button>;

        return (
            <section className={this.props.className}>
                <form>
                    <h1 className='inline-block'>Agda</h1>
                    {agdaConnectionStatus}
                    {agdaVersion}
                    <input
                        className='input-text native-key-bindings'
                        type='text' placeholder='path to Agda'
                        value={this.state.agdaPath}
                        onChange={this.handleAgdaLocationChange}
                    />
                    <p>
                        <button
                            className='btn icon icon-search inline-block-tight'
                            onClick={this.searchAgda}
                        >search</button>
                        {agdaOK ? agdaButtonDisconnect : agdaButtonConnect}
                    </p>
                    {this.state.agdaMessage &&
                        <div className="inset-panel padded text-warning">{this.state.agdaMessage}</div>
                    }
                </form>
                <hr/>
                <h3><span className="icon icon-beaker">Experimental: Agda Language Server</span></h3>
                <p>
                    <label className='input-label'>
                        <input className='input-toggle' type='checkbox' onChange={this.toggleLSPChange} /> enable Agda Language Server
                    </label>
                </p>
                { this.state.lspEnable &&
                    <form>
                        <input
                            className='input-text native-key-bindings'
                            type='text' placeholder='path to the Agda Language Server'
                            value={this.state.languageServerPath}
                            onChange={this.handleLanguageServerLocationChange}
                        />
                        <p>
                            <button
                                className="btn icon btn-primary icon-zap inline-block-tight"
                                onClick={this.connectAgda}
                            >connect</button>
                            <button
                                className="btn icon btn-success icon-search inline-block-tight"
                                onClick={this.searchLanguageServer}
                            >search</button>
                        </p>
                    </form>
                }
                {this.state.languageServerMessage &&
                    <div className="inset-panel padded text-warning">Language Server: {this.state.languageServerMessage}</div>
                }
            </section>
        );
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    null
)(Connection);
