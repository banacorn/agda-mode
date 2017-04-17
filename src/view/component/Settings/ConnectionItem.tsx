import * as React from 'react';
import * as classNames from 'classnames';

interface Props extends React.HTMLProps<HTMLElement> {
    connected: boolean;
    version: string;
    uri: string;
}

class ConnectionItem extends React.Component<Props, void> {
    constructor(props) {
        super(props);
        // this.handleClick = this.handleClick.bind(this);
    }
    render() {
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
                        <button className="btn icon icon-trashcan inline-block-tight connection-delete">remove</button>
                        <button className="btn btn-primary icon icon-plug inline-block-tight">connect</button>
                    </div>
                </div>
                <div className="connection-uri">{this.props.uri}</div>
            </div>
        )
    }


}

export default ConnectionItem;
