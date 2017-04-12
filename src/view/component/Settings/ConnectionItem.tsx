import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import * as classNames from 'classnames';
// import { View } from '../../../types';

interface Props extends React.HTMLProps<HTMLElement> {
    connected: boolean;
    version: string;
    uri: string;
}

interface State {
}


// const mapStateToProps = (state: View.State) => {
//     return {
//         messages: state.dev.messages,
//         lsp: state.dev.lsp
//     }
// }

class ConnectionItem extends React.Component<Props, State> {
    constructor(props) {
        super(props);
        // this.state = {
        //     tabIndex: 0
        // };
        // this.tabClassName = this.tabClassName.bind(this);
        // this.panelClassName = this.panelClassName.bind(this);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // <button className='btn btn-error icon icon-trashcan inline-block-tight'>Delete</button>
        // const {children, dispatch, ...props} = this.props;

        const connectedClassNames = classNames({
            hidden: !this.props.connected
        }, 'connection-panel');

        const disconnectedClassNames = classNames({
            hidden: this.props.connected
        }, 'connection-panel');

        return (
            <div className="connection">
                <div className="connection-header">
                    <h3>{this.props.version}</h3>
                    <div className={connectedClassNames}>
                        <button className="btn btn-warning icon icon-stop inline-block-tight">disonnect</button>
                    </div>
                    <div className={disconnectedClassNames}>
                        <button className="btn icon icon-trashcan inline-block-tight connection-delete">delete</button>
                        <button className="btn btn-primary icon icon-plug inline-block-tight">connect</button>
                    </div>
                </div>
                <div className="connection-uri">{this.props.uri}</div>
            </div>
        )
    }


}

export default connect<any, any, any>(
    null,
    null
)(ConnectionItem);
