import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
// import * as classNames from 'classnames';
// import { View, ConnectionInfo } from '../../../type';
// import * as Conn from '../../../connection';


type Props = React.HTMLProps<HTMLElement> & {};

class Connection extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <section className={this.props.className}>
                <h2>Connection</h2>
                <p>
                    WIP
                </p>
            </section>
        )
    }
}

export default Connection;
