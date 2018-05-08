import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, ValidPath } from '../../../type';
import * as Conn from '../../../connection';
import * as Err from '../../../error';
import * as Action from '../../actions';
import { Core } from '../../../core';
import MiniEditor from '../MiniEditor';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
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


// function mapDispatchToProps(dispatch): DispatchProps {
//     return {
//         deactivateMiniEditor: () => {
//             dispatch(MODE.display());
//         },
//     };
// }
type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        connection: state.connection
    }
}

class Connection extends React.Component<Props, State> {
    // private agdaConnectionInput: HTMLElement;
    //
    // focusAgdaConnectionInput(){
    //     this.agdaConnectionInput.focus();
    // }

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
        // this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.searchLanguageServer = this.searchLanguageServer.bind(this);
        this.toggleLSPChange = this.toggleLSPChange.bind(this);
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
    }

    handleAgdaLocationChange(event) {
        this.setState({
            agdaPath: event.target.value
        });
        atom.config.set('agda-mode.agdaPath', this.state.agdaPath);
    }

    handleLanguageServerLocationChange(event) {
        this.setState({
            languageServerPath: event.target.value
        });
    }

    // true if Agda is connected
    agdaConnected(): boolean {
        return this.props.connection.agda !== null && this.state.agdaMessage === '';
    }

    // connectAgda() {
    //     Conn.validateAgda(this.state.agdaPath)
    //         .then(validated => {
    //             this.setState({
    //                 agdaMessage: ''
    //             });
    //             // this.props.onConnect();
    //         })
    //         .catch((error) => {
    //             this.setState({
    //                 agdaMessage: error.message
    //             });
    //         })
    // }

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

    toggleAgdaConnection() {
        if (this.agdaConnected()) {
            this.props.core.commander.dispatch({ kind: 'Quit' });
        } else {
            this.props.core.commander.dispatch({ kind: 'Load' });
        }
    }

    render() {
        const agda = this.props.connection.agda;
        const agdaConnectionStatus = this.agdaConnected() ?
            <span className='inline-block highlight-success'>connected</span> :
            <span className='inline-block highlight-warning'>not connected</span>;
        const agdaVersion = this.agdaConnected() && <span className='inline-block highlight'>{agda.version.raw}</span>;

        return (
            <section className={classNames('agda-settings-connection', this.props.className)}>
                <form>
                    <ul className='agda-settings-connection-dashboard'>
                        <li>
                            <h2>
                                <label className='input-label'>
                                    <span>Connection to Agda</span>
                                    <input
                                        className='input-toggle'
                                        checked={this.agdaConnected()}
                                        type='checkbox'
                                        onChange={this.toggleAgdaConnection}
                                    />
                                </label>
                            </h2>
                            <p>
                                Connection: {this.agdaConnected() ? 'established' : 'not established'}
                            </p>
                            <p>
                                Established path: {this.agdaConnected() ? agda.path : 'unknown'}
                            </p>
                            <p>
                                Version: {this.agdaConnected() ? agda.version.raw : 'unknown'}
                            </p>
                            <p>
                                <MiniEditor
                                    placeholder='path to Agda'
                                    ref={(ref) => {
                                        if (ref)
                                            this.props.core.view.editors.connection.resolve(ref);
                                    }}
                                    onConfirm={(path) => {
                                        {/* this.props.core.view.editors.focusMain(); */}
                                    }}
                                    onCancel={() => {
                                        this.props.core.view.editors.focusMain();
                                        {/* value={this.state.agdaPath} */}
                                        {/* onChange={this.handleAgdaLocationChange} */}
                                    }}
                                />
                                {/* <input
                                    className='input-text native-key-bindings'
                                    type='text' placeholder='path to Agda'
                                    value={this.state.agdaPath}
                                    ref={(ref) => {
                                        if (ref)
                                            this.agdaConnectionInput = ref;
                                    }}
                                    onChange={this.handleAgdaLocationChange}
                                /> */}
                            </p>
                            <p>
                                <button
                                    className='btn icon icon-search inline-block-tight'
                                    onClick={this.searchAgda}
                                >search</button>
                                {this.state.agdaMessage &&
                                    <div className="inset-panel padded text-warning">{this.state.agdaMessage}</div>
                                }
                            </p>
                        </li>
                        <li>
                            <h2>
                                <label className='input-label'>
                                    <span>Enable Agda Language Server (experimental)</span>
                                    <input className='input-toggle' type='checkbox' onChange={this.toggleLSPChange} />
                                </label>
                            </h2>
                        </li>
                        <li>
                            <h2>
                                <label className='input-label'>
                                    <span>Connection to Agda Language Server</span>
                                    <input className='input-toggle' type='checkbox' onChange={this.toggleLSPChange} />
                                </label>
                            </h2>
                            <p>
                                <input
                                    className='input-text native-key-bindings'
                                    type='text' placeholder='path to Agda Language Server'
                                    value={this.state.languageServerPath}
                                    onChange={this.handleLanguageServerLocationChange}
                                />
                            </p>
                            <p>
                                {/* <button
                                    className="btn icon btn-primary icon-zap inline-block-tight"
                                    onClick={this.connectAgda}
                                >connect</button> */}
                                <button
                                    className="btn icon btn-success icon-search inline-block-tight"
                                    onClick={this.searchLanguageServer}
                                >search</button>
                                {this.state.languageServerMessage &&
                                    <div className="inset-panel padded text-warning">Language Server: {this.state.languageServerMessage}</div>
                                }
                            </p>
                        </li>
                    </ul>
                </form>
            </section>
        );
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    null
)(Connection);
