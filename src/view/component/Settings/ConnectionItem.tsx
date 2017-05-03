import * as React from 'react';
import * as classNames from 'classnames';

type Props = React.HTMLProps<HTMLElement> & {
    status: 'disconnected' | 'connecting' | 'connected';
    version: string;
    uri: string;
};

class ConnectionItem extends React.Component<Props, void> {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
        // const connectedClassNames = classNames({
        //     hidden: !this.props.connected
        // }, 'connection-panel');
        //
        // const disconnectedClassNames = classNames({
        //     hidden: this.props.connected
        // }, 'connection-panel');
        const { status, ...props } = this.props;
        // const classList = classNames({
        //     disconnected: status === 'disconnected',
        //     connecting: status === 'connecting',
        //     connected: status === 'connected'
        // }, 'connection')

        const iconClassList = classNames({
            'icon-hourglass': status === 'connecting',
            'icon-zap': status !== 'connecting'
        }, 'icon')

        return (
            <div className='connection' data-status={status}>
                <div className="connection-info">
                    <h3>{this.props.version}</h3>
                    <div className="connection-uri">{this.props.uri}</div>
                </div>
                <div className="connection-status">
                    <span className={iconClassList}></span>
                </div>
            </div>
        )
        // <div className="connection-header">
        //
        // </div>
        // <div className="connection-uri">{this.props.uri}</div>
        // <div className="connection-overlay">
        // DISCONNECT
        // </div>
        // {connected.toString()}
    }

    // <div className={connectedClassNames}>
    // <button className="btn btn-warning icon icon-stop inline-block-tight">disonnect</button>
    // </div>
    // <div className={disconnectedClassNames}>
    // <button className="btn icon icon-trashcan inline-block-tight connection-delete">remove</button>
    // <button className="btn btn-primary icon icon-plug inline-block-tight">connect</button>
    // </div>

}

export default ConnectionItem;
