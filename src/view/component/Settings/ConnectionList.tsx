import * as React from 'react';
// import { connect } from 'react-redux';
// import * as _ from 'lodash';
// import * as classNames from 'classnames';
// import { View, Connection } from '../../../type';
import * as Conn from '../../../connector';
import ConnectionItem from './ConnectionItem';
// import Core from '../../../core';

type Props = React.HTMLProps<HTMLElement> & {
    // core: Core;
    onNew: () => void;
};
type State = {
};

class ConnectionList extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        // this.state = {
        //     method: 'local',
        //     localURL: '',
        //     localMessage: ''
        // };
        // this.selectLocal = this.selectLocal.bind(this);
        // this.selectRemote = this.selectRemote.bind(this);
        // this.handleLocalURLChange = this.handleLocalURLChange.bind(this);
    }

    render() {
        // console.log(Conn.getConnections())
        return (
            <section className={this.props.className}>
                <header>
                    <h2><span className="icon icon-plug">Connections</span></h2>
                    <div>
                        <button
                            className="btn icon btn-primary icon-plus inline-block-tight"
                            onClick={this.props.onNew}
                        >new</button>
                    </div>
                </header>
                <ol>
                    {
                        // Conn.getConnections().map((conn) => {
                        //     return <ConnectionItem
                        //         key={conn.guid}
                        //         uri={conn.uri}
                        //         version={conn.version.sem}
                        //         onRemove={() => {
                        //             // Conn.removeConnection(conn.guid);
                        //         }}
                        //     />
                        // })
                }
                </ol>
            </section>
        )
    }
}

export default ConnectionList;
