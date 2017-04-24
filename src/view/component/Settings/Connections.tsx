import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Connection } from '../../../types';
import ConnectionItem from './ConnectionItem';


type Props = React.HTMLProps<HTMLElement> & View.ConnectionState;
type State = {
    showNewConnectionView: boolean;
    method: 'local' | 'remote';
};

const mapStateToProps = ({ connection } : View.State) => connection

// const mapDispatchToProps = (dispatch: any) => ({
//     handleNewConnection: () => {
//         dispatch(Action.mountAtPane());
//     }
// });

class Connections extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            showNewConnectionView: props.showNewConnectionView,
            method: 'local'
        };
        this.showNewConnectionView = this.showNewConnectionView.bind(this);
        this.hideNewConnectionView = this.hideNewConnectionView.bind(this);
        this.selectLocal = this.selectLocal.bind(this);
        this.selectRemote = this.selectRemote.bind(this);
    }

    showNewConnectionView() {
        this.setState({
            showNewConnectionView: true
        } as State);
    }

    hideNewConnectionView() {
        this.setState({
            showNewConnectionView: false
        } as State);
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
        const {
            showNewConnectionView
        } = this.state;


        const mainClassList = classNames({
            hidden: showNewConnectionView
        });

        const newConnClassList = classNames({
            hidden: !showNewConnectionView
        });

        const disableLocal = this.state.method !== 'local';
        const disableRemote = this.state.method !== 'remote';

        return (
            <section className={this.props.className}>
                <div className={mainClassList}>
                    <header>
                        <h2><span className="icon icon-plug">Connections</span></h2>
                        <div>
                            <button
                                className="btn icon btn-primary icon-plus inline-block-tight"
                                onClick={this.showNewConnectionView}
                            >new</button>
                        </div>
                    </header>
                </div>
                <div className={newConnClassList}>
                    <header>
                        <h2><span className="icon icon-plus">New Connection</span></h2>
                        <div>
                            <button
                                className="btn icon icon-x inline-block-tight"
                                onClick={this.hideNewConnectionView}
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
                                    onClick={this.showNewConnectionView}
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
                                    onClick={this.showNewConnectionView}
                                    disabled={disableRemote}
                                >connect</button>
                            </label>
                        </form>
                    </section>
                </div>
            </section>
        )
    }


}

// export default connect<View.ConnectionState, {}, Props>(
export default connect<any, any, any>(
    mapStateToProps
)(Connections);


// <section {...props}>
//     <section className={currentConnectionClassList}>
//         <h2><span className="icon icon-plug">Current Connection</span></h2>
//         { current ?
//             <ConnectionItem
//                 status="connected"
//                 version="Agda-2.5.2"
//                 uri="path/to/agda"
//             /> :
//             <div className="no-connection">
//                 <span className="icon icon-stop">no connection established</span>
//             </div>
//         }
//     </section>
//     <section className="previous-connections">
//         <h2><span className="icon icon-repo">Previous Connections</span></h2>
//         <p>
//             A list of previously established connections to Agda
//         </p>
//         <ol>
//             <li>
//                 <ConnectionItem
//                     status="connecting"
//                     version="Agda-2.6-2ade23"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="connected"
//                     version="Agda-2.6"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="disconnected"
//                     version="Agda-2.6"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="disconnected"
//                     version="Agda-2.5.2"
//                     uri="path/to/agda"
//                 />
//             </li>
//             <li>
//                 <ConnectionItem
//                     status="disconnected"
//                     version="Agda-2.5.2"
//                     uri="path/to/agda"
//                 />
//             </li>
//         </ol>
//     </section>
// </section>

    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.3.2"
    //         uri="path/to/agda"
    //     />
    // </li>
    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.3.2"
    //         uri="path/to/agda"
    //     />
    // </li>
    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.5"
    //         uri="path/to/agda"
    //     />
    // </li>
    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.3.2"
    //         uri="path/to/agda"
    //     />
    // </li>
    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.3.2"
    //         uri="path/to/agda"
    //     />
    // </li>
    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.3.2"
    //         uri="path/to/agda"
    //     />
    // </li>
