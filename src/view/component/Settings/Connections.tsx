import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Connection } from '../../../type';
import ConnectionItem from './ConnectionItem';
import NewConnection from './NewConnection';

type OwnProps = View.ConnectionState;
type Props = React.HTMLProps<HTMLElement> & OwnProps;
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

        return (
            <div className={this.props.className}>
                <section className={mainClassList}>
                    <header>
                        <h2><span className="icon icon-plug">Connections</span></h2>
                        <div>
                            <button
                                className="btn icon btn-primary icon-plus inline-block-tight"
                                onClick={this.showNewConnectionView}
                            >new</button>
                        </div>
                    </header>
                </section>
                <NewConnection
                    show={showNewConnectionView}
                    onCancel={() => {
                        this.setState({
                            showNewConnectionView: false
                        } as State);
                    }}
                />
            </div>
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
