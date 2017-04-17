import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
import { View, Connection } from '../../../types';
import ConnectionItem from './ConnectionItem';

interface Props extends React.HTMLProps<HTMLElement> {
    // connections: Connection[];
    // connected?: number;
}

interface DopedProps extends Props {
    connections: Connection[];
    // connected?: number;
}

const mapStateToProps = (state: View.State) => {
    return state.connection
}

class Connections extends React.Component<DopedProps, void> {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // <button className='btn btn-error icon icon-trashcan inline-block-tight'>Delete</button>

        const {dispatch, connections, ...props} = this.props;
        // console.log(connections);

        const previousConnections = connections.map((conn, i) =>
            <li key={i.toString()}>
                <ConnectionItem
                    connected={false}
                    version={conn.version.raw}
                    uri={conn.uri}
                />
            </li>
        );

        return (
            <section {...props}>
                <section className="current-connection">
                    <h2><span className="icon icon-plug">Current Connection</span></h2>
                    <ConnectionItem
                        connected={true}
                        version="Agda-2.5.2"
                        uri="path/to/agda"
                    />
                </section>
                <section className="previous-connections">
                    <h2><span className="icon icon-repo">Previous Connections</span></h2>
                    <p>
                        A list of previously established connections to Agda
                    </p>
                    <ol>
                        {previousConnections}
                    </ol>
                </section>
            </section>
        )
    }


}

export default connect<View.ConnectionState, {}, Props>(
    mapStateToProps
)(Connections);

    // <li>
    //     <ConnectionItem
    //         connected={false}
    //         version="Agda-2.6"
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
