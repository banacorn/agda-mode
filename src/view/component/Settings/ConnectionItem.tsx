import * as React from 'react';
import * as classNames from 'classnames';

type Props = React.HTMLProps<HTMLElement> & {
    version: string;
    uri: string;
    selected: boolean;
    connected: boolean;
    // callbacks
    onRemove: (e: any) => void;
    onSelect: () => void;
    // on: (e: any) => void;
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
            <li
                className={classNames({
                    selected: this.props.selected
                }, 'connection')}
                onClick={this.props.onSelect}
            >
                <header className="compact">
                    <h3>{this.props.version}</h3>
                    <div className="connection-dashboard">
                        <span
                            className={classNames({
                                connected: this.props.connected
                            }, "icon icon-zap")}
                        ></span>
                        <span
                            className="icon icon-x"
                            onClick={this.props.onRemove}
                        ></span>
                    </div>
                </header>
                <div className="connection-uri">{this.props.uri}</div>
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
