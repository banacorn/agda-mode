import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import { View } from '../../../type';
import * as Conn from '../../../connection';
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
}

function mapDispatchToProps(dispatch): DispatchProps {
    return {
        setAgdaMessage: (message: string) => {
            dispatch(Action.CONNECTION.setAgdaMessage(message));
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
        // agda
        this.toggleAgdaConnection = this.toggleAgdaConnection.bind(this);
        this.agdaConnected = this.agdaConnected.bind(this);
        this.searchAgda = this.searchAgda.bind(this);
        this.reconnectAgda = this.reconnectAgda.bind(this);
    }

    ////////////////////////////////////////////////////
    // Agda
    ////////////////////////////////////////////////////

    toggleAgdaConnection() {
        if (this.agdaConnected()) {
            this.props.core.commander.dispatch({ kind: 'Quit' });
        } else {
            this.reconnectAgda()
        }
    }

    // true if Agda is connected
    agdaConnected(): boolean {
        return this.props.connection.agda !== null && this.props.connection.agdaMessage === '';
    }

    reconnectAgda() {
        this.props.core.commander.dispatch({ kind: 'Restart' });
    }

    searchAgda() {
        Conn.autoSearch('agda')
            .then(Conn.validateAgda)
            .then(Conn.setAgdaPath)
            .then(() => {
                this.forceUpdate()
            })
            .catch(this.props.core.connection.handleAgdaError);
        // prevent this button from submitting the entire form
        return false;
    }

    ////////////////////////////////////////////////////
    // Render
    ////////////////////////////////////////////////////


    render() {
        const agda = this.props.connection.agda;
        const querying = this.props.connection.querying;
        const className = classNames('agda-settings-connection', this.props.className, {
            querying: querying
        });
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
                                                this.reconnectAgda();
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
                                    <p className="inset-panel padded text-warning error">{this.props.connection.agdaMessage}</p>
                                }
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
