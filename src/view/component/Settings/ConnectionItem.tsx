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
    onSelectAndLoad: () => void;
};

class ConnectionItem extends React.Component<Props, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <li
                className={classNames({
                    selected: this.props.selected,
                    connected: this.props.connected
                }, 'connection')}
                onClick={this.props.onSelect}
                onDoubleClick={this.props.onSelectAndLoad}
            >
                <header className="compact">
                    <h3>{this.props.version}</h3>
                    <div className="connection-dashboard">
                        <span
                            className="icon icon-x"
                            onClick={this.props.onRemove}
                        ></span>
                    </div>
                </header>
                <div className="connection-uri">{this.props.uri}</div>
            </li>
        )
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
