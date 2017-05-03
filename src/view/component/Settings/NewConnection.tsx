import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Connection } from '../../../type';
import Core from '../../../core';

type Props = React.HTMLProps<HTMLElement> & {
    core: Core;
    show: boolean;
    onCancel: () => void;
};
type State = {
    method: 'local' | 'remote';
};

class NewConnection extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            method: 'local'
        };
        this.selectLocal = this.selectLocal.bind(this);
        this.selectRemote = this.selectRemote.bind(this);
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

    render() {
        const disableLocal = this.state.method !== 'local';
        const disableRemote = this.state.method !== 'remote';
        const classList = classNames({
            hidden: !this.props.show
        })
        return (
            <section className={classList}>
                <header>
                    <h2><span className="icon icon-plus">New Connection</span></h2>
                    <div>
                        <button
                            className="btn icon icon-x inline-block-tight"
                            onClick={this.props.onCancel}
                        >cancel</button>
                    </div>
                </header>
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
                            />
                            <button
                                className="btn icon btn-primary icon-zap inline-block-tight"
                                disabled={disableLocal}
                            >connect</button>
                        </label>
                        <hr/>
                        <input
                            id="remote-connection" className='input-radio'
                            type='radio' name='connection-method'
                            onChange={this.selectRemote}
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

export default NewConnection;
