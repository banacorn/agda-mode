import * as React from 'react';
import * as classNames from 'classnames';

type Props = React.HTMLProps<HTMLElement> & {
    // status: 'disconnected' | 'connecting' | 'connected';
    version: string;
    uri: string;
    pinned: boolean;
    // callbacks
    onRemove: () => void;
    onPin: () => void;
};

class ConnectionItem extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        // const { status, ...props } = this.props;

        // const iconClassList = classNames({
        //     'icon-hourglass': status === 'connecting',
        //     'icon-zap': status !== 'connecting'
        // }, 'icon')

        return (
            <li className='connection'>
                <div className="connection-info">
                    <header className="compact">
                        <h3>{this.props.version}</h3>
                        <div className="connection-dashboard">
                            <span
                                className={classNames({
                                    pinned: this.props.pinned
                                }, "icon icon-pin")}
                                onClick={this.props.onPin}
                            ></span>
                            <span
                                className="icon icon-x"
                                onClick={this.props.onRemove}
                            ></span>
                        </div>
                    </header>
                    <div className="connection-uri">{this.props.uri}</div>
                </div>
            </li>
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
