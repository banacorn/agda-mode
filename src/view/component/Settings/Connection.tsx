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

type InjProps = {
    connection: View.ConnectionState;
}
type DispatchProps = {
    setAgdaMessage: (message: string) => void;
    toggleEnableLanguageServer: (enable: boolean) => void;
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        setAgdaMessage: (message: string) => {
            dispatch(Action.CONNECTION.setAgdaMessage(message));
        },
        toggleEnableLanguageServer: (enable: boolean) => {
            dispatch(Action.CONNECTION.enableLanguageServer(enable));
        },
    };
}

type Props = OwnProps & InjProps & DispatchProps;

function mapStateToProps(state: View.State): InjProps {
    return {
        connection: state.connection
    }
}

class Connection extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
        this.state = {
            enableLanguageServer: atom.config.get('agda-mode.languageServerPath') === '',
        };
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
        this.agdaConnected = this.agdaConnected.bind(this);
        this.connectAgda = this.connectAgda.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.languageServerConnected = this.languageServerConnected.bind(this);
        this.toggleLanguageServerConnection = this.toggleLanguageServerConnection.bind(this);
    }

    ////////////////////////////////////////////////////
    // Agda
    ////////////////////////////////////////////////////

    toggleAgdaConnection() {
        if (this.agdaConnected()) {
            this.props.core.commander.dispatch({ kind: 'Quit' });
        } else {
            this.connectAgda()
        }
    }

    // true if Agda is connected
    agdaConnected(): boolean {
        return this.props.connection.agda !== null && this.props.connection.agdaMessage === '';
    }

    connectAgda() {
        this.props.core.commander.dispatch({ kind: 'Load' });
    }

    searchAgda() {
        Conn.autoSearch('agda')
            .then(Conn.validateAgda)
            .then(Conn.setAgdaPath)
            .then(() => {
                this.forceUpdate()
            })
            .catch(this.props.core.connection.handleError);
        // prevent this button from submitting the entire form
        return false;
    }

    ////////////////////////////////////////////////////
    // Languager Server
    ////////////////////////////////////////////////////

    toggleLanguageServerConnection() {
    }

    languageServerConnected(): boolean {
        return this.props.connection.languageServer !== null
            && this.props.connection.languageServerMessage === ''
            && this.props.connection.languageServerEnabled;
    }

    render() {
        const agda = this.props.connection.agda;
        const querying = this.props.connection.querying;
        const className = classNames('agda-settings-connection', this.props.className, {
            querying: querying
        });
        const agdaConnectionStatus = this.agdaConnected() ?
            <span className='inline-block highlight-success'>connected</span> :
            <span className='inline-block highlight-warning'>not connected</span>;
        const agdaVersion = this.agdaConnected() && <span className='inline-block highlight'>{agda.version.raw}</span>;
        return (
            <section className={className}>
                <form>
                    <ul className='agda-settings-connection-dashboard'>
                        <li id='agda-settings-connection-agda'>
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
                            <div>
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
                                        value={atom.config.get('agda-mode.agdaPath')}
                                        placeholder='path to Agda'
                                        ref={(ref) => {
                                            if (ref)
                                                this.props.core.view.editors.connection.resolve(ref);
                                        }}
                                        onConfirm={(path) => {
                                            atom.config.set('agda-mode.agdaPath', path);
                                            if (!querying) {
                                                this.connectAgda();
                                            }
                                        }}
                                        onCancel={() => {
                                            this.props.core.view.editors.focusMain();
                                        }}

                                    />
                                </p>
                                <p>
                                    <button
                                        className='btn icon icon-search inline-block-tight'
                                        onClick={this.searchAgda}
                                    >auto search</button>
                                </p>
                                {this.props.connection.agdaMessage &&
                                    <p className="inset-panel padded text-warning">{this.props.connection.agdaMessage}</p>
                                }
                            </div>
                        </li>
                        <li>
                            <h2>
                                <label className='input-label'>
                                    <span>Enable Agda Language Server (experimental)</span>
                                    <input
                                        className='input-toggle'
                                        defaultChecked={this.props.connection.languageServerEnabled}
                                        type='checkbox'
                                        disabled={querying}
                                        onChange={() => {
                                            atom.config.set('agda-mode.languageServerEnabled', !this.props.connection.languageServerEnabled);
                                            if (this.props.connection.languageServerEnabled)
                                                this.props.toggleEnableLanguageServer(false);
                                            else
                                                this.props.toggleEnableLanguageServer(true);
                                        }}
                                    />
                                </label>
                            </h2>
                        </li>
                        <li className={classNames({hidden: !this.props.connection.languageServerEnabled})}>
                            <h2>
                                <label className='input-label'>
                                    <span>Connection to Agda Language Server</span>
                                    <input className='input-toggle' type='checkbox' disabled={querying} onChange={this.toggleLanguageServerConnection} />
                                </label>
                            </h2>
                            <div>
                                <p>
                                    <input
                                        value={atom.config.get('agda-mode.languageServerPath')}
                                        defaultChecked={this.languageServerConnected()}
                                        className='input-text native-key-bindings'
                                        type='text' placeholder='path to Agda Language Server'
                                        disabled={querying}
                                    />
                                </p>
                                <p>
                                    <button
                                        className='btn icon icon-search inline-block-tight'
                                        disabled={querying}
                                    >auto search</button>
                                    {/* {this.state.languageServerMessage &&
                                        <div className="inset-panel padded text-warning">Language Server: {this.state.languageServerMessage}</div>
                                    } */}
                                </p>
                            </div>
                        </li>
                    </ul>
                </form>
            </section>
        );
    }
}

export default connect<InjProps, DispatchProps, OwnProps>(
    mapStateToProps,
    mapDispatchToProps
)(Connection);
