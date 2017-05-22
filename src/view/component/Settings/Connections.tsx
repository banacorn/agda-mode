import * as React from 'react';
import { connect } from 'react-redux';
// import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Connection } from '../../../type';
import NewConnection from './NewConnection';
import ConnectionList from './ConnectionList';
import * as Conn from '../../../connector';
import Core from '../../../core';

type OwnProps = React.HTMLProps<HTMLElement> & {
    core: Core;
};
type InjProps = View.ConnectionState;
type Props = OwnProps & InjProps;

type State = {
    showNewConnectionView: boolean;
    method: 'local' | 'remote';
};

const mapStateToProps = ({ connection }): InjProps => connection

// const mapDispatchToProps = (dispatch) => ({
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
    }

    toggleNewConnectionView(show: boolean) {
        return () => {
            this.setState({
                showNewConnectionView: show
            } as State);
        }
    }

    render() {
        const { core } = this.props;
        const { showNewConnectionView } = this.state;

        return (
            <div className={this.props.className}>
                <ConnectionList
                    className={classNames({
                        hidden: showNewConnectionView
                    })}
                    onNew={this.toggleNewConnectionView(true)}
                    onConnect={(connInfo) => {
                        core.connector.disconnect();
                        core.connector.connect(connInfo);
                    }}
                    onRemove={(connInfo) => {
                        core.connector.disconnect(connInfo);
                    }}
                />
                <NewConnection
                    core={this.props.core}
                    className={classNames({
                        hidden: !showNewConnectionView
                    })}
                    onCancel={this.toggleNewConnectionView(false)}
                />
            </div>
        )
    }
}

// export default connect<View.ConnectionState, {}, Props>(
export default connect<InjProps, {}, OwnProps>(
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
